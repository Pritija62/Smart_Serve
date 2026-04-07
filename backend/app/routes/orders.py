from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db, socketio
from app.models import Order, OrderItem, MenuItem
from datetime import datetime
import uuid

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


@orders_bp.route('/', methods=['POST'])
@cross_origin()
def create_order():
    """Create a new order"""
    data = request.get_json()
    
    # Validate input
    if not data or 'items' not in data or 'table_number' not in data:
        return jsonify({'error': 'Missing items or table_number'}), 400
    
    if not data['items']:
        return jsonify({'error': 'Order must have at least one item'}), 400
    
    try:
        # Create order
        order = Order(
            table_number=data['table_number'],
            tracking_token=uuid.uuid4().hex
        )
        
        total_price = 0
        max_prep_time = 0
        
        # Add items to order
        for item_data in data['items']:
            menu_item = MenuItem.query.get(item_data['menu_item_id'])
            
            if not menu_item:
                return jsonify({'error': f'Menu item {item_data["menu_item_id"]} not found'}), 404
            
            order_item = OrderItem(
                menu_item_id=item_data['menu_item_id'],
                quantity=item_data.get('quantity', 1),
                special_instructions=item_data.get('special_instructions')
            )
            
            order.order_items.append(order_item)
            total_price += menu_item.price * item_data.get('quantity', 1)
            max_prep_time = max(max_prep_time, menu_item.prep_time)
        
        order.total_price = total_price
        order.estimated_wait_time = int(max_prep_time * 1.5)  # Add 50% buffer
        
        db.session.add(order)
        db.session.commit()
        socketio.emit('new_order', order.to_dict())
        
        return jsonify({
            'order_id': order.id,
            'total_price': order.total_price,
            'estimated_wait_time': order.estimated_wait_time,
            'tracking_token': order.tracking_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@orders_bp.route('/<int:order_id>/track', methods=['GET'])
@cross_origin()
def track_order(order_id):
    """Track order status (public endpoint)"""
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify(order.to_dict()), 200


@orders_bp.route('/', methods=['GET'])
@cross_origin()
def get_my_orders():
    """Get user's orders (future use)"""
    return jsonify([]), 200