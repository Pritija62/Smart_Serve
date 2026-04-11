from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db
from app.models import MenuItem, OrderItem
from app.services.recommendation_engine import RecommendationEngine

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
    """Get popular menu items using a weighted recency-based ranking."""
    days = request.args.get('days', default=30, type=int)
    limit = request.args.get('limit', default=5, type=int)

    popular_items = RecommendationEngine.get_popular_items(days=days, limit=limit)
    return jsonify(popular_items), 200