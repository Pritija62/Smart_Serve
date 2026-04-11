from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db
from app.models import MenuItem, Order, OrderItem
from app.algorithms import AprioriAnalyzer
from app.services.recommendation_engine import RecommendationEngine
from datetime import datetime, timedelta

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


@menu_bp.route('/<int:item_id>/recommendations', methods=['GET'])
@cross_origin()
def get_item_recommendations(item_id):
    """Get Apriori-based recommendations for a single menu item."""
    item = MenuItem.query.get(item_id)

    if not item or not item.is_available:
        return jsonify({'error': 'Item not found'}), 404

    days = request.args.get('days', default=30, type=int)
    limit = request.args.get('limit', default=4, type=int)
    min_support = request.args.get('min_support', default=0.1, type=float)
    min_confidence = request.args.get('min_confidence', default=0.3, type=float)

    days = max(1, min(days, 365))
    limit = max(1, min(limit, 10))
    min_support = max(0.0, min(1.0, min_support))
    min_confidence = max(0.0, min(1.0, min_confidence))

    since = datetime.utcnow() - timedelta(days=days)
    orders = Order.query.filter(Order.created_at >= since).all()

    analyzer = AprioriAnalyzer(min_support=min_support, min_confidence=min_confidence)
    analyzer.load_transactions(orders)

    if not analyzer.transactions:
        return jsonify([]), 200

    analyzer.find_frequent_itemsets()
    analyzer.generate_association_rules()
    predicted = analyzer.predict_items([item.name])

    if not predicted:
        return jsonify([]), 200

    predicted_names = [p['item'] for p in predicted[:limit]]
    menu_items = MenuItem.query.filter(MenuItem.name.in_(predicted_names), MenuItem.is_available == True).all()
    menu_by_name = {menu_item.name: menu_item for menu_item in menu_items}

    recommendations = []
    for prediction in predicted:
        candidate = menu_by_name.get(prediction['item'])
        if not candidate:
            continue

        candidate_dict = candidate.to_dict()
        recommendations.append({
            'id': candidate_dict['id'],
            'name': candidate_dict['name'],
            'description': candidate_dict['description'],
            'price': candidate_dict['price'],
            'station': candidate_dict['station'],
            'confidence': prediction['confidence'],
            'lift': prediction['lift'],
        })

        if len(recommendations) >= limit:
            break

    return jsonify(recommendations), 200