from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app import db
from app.models import Order, User
from app.algorithms import AprioriAnalyzer
import jwt
import os
from functools import wraps
from datetime import datetime, timedelta
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/admin/analysis')
def verify_admin(f):
    """Decorator to verify admin authentication (mirrors admin.py)."""
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
@analysis_bp.route('/market-basket', methods=['GET'])
@cross_origin()
@verify_admin
def market_basket_analysis():
    """
    Run Apriori market basket analysis on historical orders.
    Query parameters:
        days          – how many past days to include (default 30)
        min_support   – minimum support threshold (default 0.05 = 5%)
        min_confidence – minimum confidence threshold (default 0.2 = 20%)
    """
    try:
        days = int(request.args.get('days', 30))
        min_support = float(request.args.get('min_support', 0.05))
        min_confidence = float(request.args.get('min_confidence', 0.2))
    except ValueError:
        return jsonify({'error': 'Invalid query parameters'}), 400
    # Clamp thresholds to [0, 1]
    min_support = max(0.0, min(1.0, min_support))
    min_confidence = max(0.0, min(1.0, min_confidence))
    since = datetime.utcnow() - timedelta(days=days)
    orders = (
        Order.query
        .filter(Order.created_at >= since)
        .all()
    )
    analyzer = AprioriAnalyzer(
        min_support=min_support,
        min_confidence=min_confidence,
    )
    result = analyzer.run_analysis(orders)
    top_rules = analyzer.get_top_rules(15)
    return jsonify({
        'summary': {
            'total_orders': result['total_transactions'],
            'total_rules': result['total_rules'],
            'analysis_period_days': days,
            'min_support': min_support,
            'min_confidence': min_confidence,
        },
        'frequent_itemsets': result['frequent_itemsets'],
        'association_rules': result['association_rules'],
        'top_rules': top_rules,
    }), 200
@analysis_bp.route('/predict-items', methods=['POST'])
@cross_origin()
@verify_admin
def predict_items():
    """
    Recommend items a customer might buy next given their current cart.
    Request body:
        { "items": ["item1", "item2"], "days": 30,
          "min_support": 0.3, "min_confidence": 0.7 }
    """
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({'error': 'Missing "items" in request body'}), 400
    current_items = data.get('items', [])
    if not isinstance(current_items, list):
        return jsonify({'error': '"items" must be a list'}), 400
    try:
        days = int(data.get('days', 30))
        min_support = float(data.get('min_support', 0.05))
        min_confidence = float(data.get('min_confidence', 0.2))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid parameter values'}), 400
    min_support = max(0.0, min(1.0, min_support))
    min_confidence = max(0.0, min(1.0, min_confidence))
    since = datetime.utcnow() - timedelta(days=days)
    orders = Order.query.filter(Order.created_at >= since).all()
    analyzer = AprioriAnalyzer(
        min_support=min_support,
        min_confidence=min_confidence,
    )
    analyzer.load_transactions(orders)
    analyzer.find_frequent_itemsets()
    analyzer.generate_association_rules()
    predictions = analyzer.predict_items(current_items)
    return jsonify({
        'current_items': current_items,
        'predictions': predictions,
        'total_orders_analyzed': len(analyzer.transactions),
    }), 200
