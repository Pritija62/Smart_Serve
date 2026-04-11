from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db,socketio
from app.models import Order, User
import jwt
import os
from functools import wraps
from datetime import datetime, timedelta

kitchen_bp = Blueprint('kitchen', __name__, url_prefix='/api/kitchen')


def _get_priority_weights():
    """Load configurable hybrid scheduling weights from environment variables."""
    def _env_float(name, default):
        try:
            return float(os.getenv(name, default))
        except (TypeError, ValueError):
            return float(default)

    return {
        'spt': _env_float('KITCHEN_WEIGHT_SPT', 0.5),
        'urgency': _env_float('KITCHEN_WEIGHT_URGENCY', 0.3),
        'aging': _env_float('KITCHEN_WEIGHT_AGING', 0.2),
    }


def _safe_seconds(value, fallback=300):
    """Return a positive integer seconds value for scoring math."""
    try:
        seconds = int(value)
        return seconds if seconds > 0 else fallback
    except (TypeError, ValueError):
        return fallback


def _compute_priority_score(order, now_utc, weights=None):
    """Hybrid priority score: SPT + slack urgency (LST-like) + aging."""
    weights = weights or _get_priority_weights()

    # Predicted prep time proxy in seconds.
    predicted_prep = _safe_seconds(order.estimated_wait_time, fallback=300)

    # promised_ready_time ~= created_at + estimated_wait_time
    promised_ready_at = order.created_at + timedelta(seconds=predicted_prep)
    # Correct slack definition here because promised_ready_at already includes prep time.
    slack_seconds = int((promised_ready_at - now_utc).total_seconds())

    age_minutes = max(0.0, (now_utc - order.created_at).total_seconds() / 60.0)

    # Normalized terms for stable weighted ranking.
    spt_term = 1.0 / max(60.0, float(predicted_prep))

    if slack_seconds <= 0:
        # Overdue orders get boosted urgency, but keep scale bounded near other terms.
        urgency_term = min(0.05, 0.01 + (abs(slack_seconds) / 3600.0))
    else:
        urgency_term = 1.0 / max(300.0, float(slack_seconds))

    aging_term = min(3.0, age_minutes / 10.0)

    # Weights: speed (SPT) + urgency (slack) + fairness (aging)
    score = (
        (weights['spt'] * spt_term)
        + (weights['urgency'] * urgency_term)
        + (weights['aging'] * aging_term)
    )

    return {
        'score': score,
        'predicted_prep': predicted_prep,
        'promised_ready_at': promised_ready_at.isoformat(),
        'slack_seconds': slack_seconds,
        'age_minutes': round(age_minutes, 2),
        'terms': {
            'spt': round(spt_term, 6),
            'urgency': round(urgency_term, 6),
            'aging': round(aging_term, 6),
        },
        'weights': weights,
    }


def verify_kitchen_auth(f):
    """Decorator to verify kitchen staff authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Missing authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, os.getenv('JWT_SECRET', 'jwt-key'), algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except IndexError:
            return jsonify({'error': 'Invalid authorization header'}), 401
        
        user = User.query.get(payload['user_id'])
        
        if not user or user.role not in ['kitchen_staff', 'admin']:
            return jsonify({'error': 'Not authorized'}), 403
        
        request.user = user
        return f(*args, **kwargs)
    
    return decorated


@kitchen_bp.route('/queue', methods=['GET'])
@cross_origin()
@verify_kitchen_auth
def get_queue():
    """Get active kitchen queue ranked by hybrid scheduling priority."""
    orders = Order.query.filter(Order.status.in_(['pending', 'preparing'])).all()
    now_utc = datetime.utcnow()
    weights = _get_priority_weights()

    scored_orders = []
    for order in orders:
        ranking = _compute_priority_score(order, now_utc, weights)
        scored_orders.append((order, ranking))

    ranked_orders = sorted(
        scored_orders,
        key=lambda item: item[1]['score'],
        reverse=True,
    )

    return jsonify([
        {
            **order.to_dict(),
            'priority': ranking,
        }
        for order, ranking in ranked_orders
    ]), 200


@kitchen_bp.route('/queue/<station>', methods=['GET'])
@cross_origin()
@verify_kitchen_auth
def get_queue_by_station(station):
    """Get station queue ranked by the same hybrid scheduling priority."""
    orders = db.session.query(Order).join(Order.order_items).filter(
        Order.status.in_(['pending', 'preparing'])
    ).distinct().all()
    
    # Filter by station
    filtered_orders = []
    for order in orders:
        for item in order.order_items:
            if item.menu_item.station == station:
                filtered_orders.append(order)
                break

    now_utc = datetime.utcnow()
    weights = _get_priority_weights()
    scored_orders = []

    
    ranked_orders = sorted(
        [
            (order, _compute_priority_score(order, now_utc, weights))
            for order in filtered_orders
        ],
        key=lambda item: item[1]['score'],
        reverse=True,
    )

    return jsonify([
        {
            **order.to_dict(),
            'priority': ranking,
        }
        for order, ranking in ranked_orders
    ]), 200


@kitchen_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@cross_origin()
@verify_kitchen_auth
def update_order_status(order_id):
    """Update order status"""
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({'error': 'Missing status'}), 400
    
    valid_statuses = ['pending', 'preparing', 'ready', 'completed']
    if data['status'] not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
    
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    order.status = data['status']
    
    if data['status'] == 'completed':
        order.completed_at = datetime.utcnow()
    
    db.session.commit()
    order_payload = order.to_dict()
    order_payload['orderId'] = order.id
    socketio.emit('order_status_updated', order_payload, room='role_kitchen')
    socketio.emit('order_status_updated', order_payload, room='role_admin')
    socketio.emit('order_status_updated', order_payload, room=f'order_{order.id}')
    
    return jsonify({
        'message': 'Order updated',
        'order': order.to_dict()
    }), 200
