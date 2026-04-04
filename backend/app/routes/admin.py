from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db
from app.models import Order, OrderItem, MenuItem, User
import jwt
import os
from functools import wraps
from sqlalchemy import func, extract
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def verify_admin(f):
    """Decorator to verify admin authentication"""
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
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin only'}), 403
        
        request.user = user
        return f(*args, **kwargs)
    
    return decorated


@admin_bp.route('/analytics/weekly-sales', methods=['GET'])
@cross_origin()
@verify_admin
def get_weekly_sales():
    """Get top selling items this week"""
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    results = db.session.query(
        MenuItem.name,
        func.sum(OrderItem.quantity).label('quantity_sold'),
        func.sum(MenuItem.price * OrderItem.quantity).label('revenue')
    ).join(OrderItem).join(Order).filter(
        Order.created_at >= week_ago
    ).group_by(MenuItem.id).order_by(
        func.sum(OrderItem.quantity).desc()
    ).limit(10).all()
    
    sales = [{
        'item_name': result[0],
        'quantity_sold': result[1],
        'revenue': result[2]
    } for result in results]
    
    return jsonify(sales), 200


@admin_bp.route('/analytics/hourly-trends', methods=['GET'])
@cross_origin()
@verify_admin
def get_hourly_trends():
    """Get order volume by hour (last 24 hours)"""
    day_ago = datetime.utcnow() - timedelta(hours=24)
    
    results = db.session.query(
        extract('hour', Order.created_at).label('hour'),
        func.count(Order.id).label('order_count')
    ).filter(
        Order.created_at >= day_ago
    ).group_by(
        extract('hour', Order.created_at)
    ).order_by(
        extract('hour', Order.created_at)
    ).all()
    
    trends = [{
        'hour': int(result[0]),
        'order_count': result[1]
    } for result in results]
    
    return jsonify(trends), 200


@admin_bp.route('/orders/all', methods=['GET'])
@cross_origin()
@verify_admin
def get_all_orders():
    """Get all orders"""
    orders = Order.query.order_by(Order.created_at.desc()).all()
    return jsonify([order.to_dict() for order in orders]), 200