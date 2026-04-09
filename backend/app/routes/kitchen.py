from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db,socketio
from app.models import Order, User
import jwt
import os
from functools import wraps
from datetime import datetime

kitchen_bp = Blueprint('kitchen', __name__, url_prefix='/api/kitchen')


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
    """Get all pending orders"""
    orders = Order.query.filter(Order.status.in_(['pending', 'preparing'])).order_by(Order.created_at.asc()).all()
    return jsonify([order.to_dict() for order in orders]), 200


@kitchen_bp.route('/queue/<station>', methods=['GET'])
@cross_origin()
@verify_kitchen_auth
def get_queue_by_station(station):
    """Get orders for specific station"""
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
    
    return jsonify([order.to_dict() for order in filtered_orders]), 200


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
