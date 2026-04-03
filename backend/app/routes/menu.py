from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db
from app.models import MenuItem, OrderItem
from sqlalchemy import func

menu_bp = Blueprint('menu', __name__, url_prefix='/api/menu')


@menu_bp.route('/', methods=['GET'])
@cross_origin()
def get_menu():
    """Get all available menu items"""
    items = MenuItem.query.filter_by(is_available=True).order_by(MenuItem.created_at.desc()).all()
    return jsonify([item.to_dict() for item in items]), 200


@menu_bp.route('/<int:item_id>', methods=['GET'])
@cross_origin()
def get_menu_item(item_id):
    """Get single menu item"""
    item = MenuItem.query.get(item_id)
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    return jsonify(item.to_dict()), 200


@menu_bp.route('/recommendations', methods=['GET'])
@cross_origin()
def get_recommendations():
    """Get top recommended items based on order frequency"""
    # Get top 5 most ordered items
    top_items = db.session.query(MenuItem).join(OrderItem).group_by(MenuItem.id).order_by(
        func.count(OrderItem.id).desc()
    ).limit(5).all()
    
    if not top_items:
        # If no orders yet, return top 5 by creation date
        top_items = MenuItem.query.filter_by(is_available=True).order_by(MenuItem.created_at).limit(5).all()
    
    return jsonify([item.to_dict() for item in top_items]), 200