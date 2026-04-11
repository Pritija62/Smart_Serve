from app import db
from app.models import MenuItem, OrderItem, Order
from datetime import datetime, timedelta
from math import exp
from sqlalchemy import func


class RecommendationEngine:
    """Service for generating recommendations"""
    
    @staticmethod
    def get_popular_items(days=30, limit=5, decay_lambda=0.12):
        """Get popular menu items using weighted frequency with recency decay."""
        days_ago = datetime.utcnow() - timedelta(days=days)

        order_rows = db.session.query(
            MenuItem,
            OrderItem.quantity,
            Order.created_at,
        ).join(OrderItem, OrderItem.menu_item_id == MenuItem.id).join(
            Order, OrderItem.order_id == Order.id
        ).filter(
            Order.created_at >= days_ago,
            MenuItem.is_available.is_(True),
        ).all()

        if not order_rows:
            fallback_items = MenuItem.query.filter_by(is_available=True).order_by(
                MenuItem.created_at.desc()
            ).limit(limit).all()

            return [
                {
                    **item.to_dict(),
                    'order_count': 0,
                    'total_quantity': 0,
                    'popularity_score': 0,
                    'confidence': 0,
                }
                for item in fallback_items
            ]

        scores = {}
        quantities = {}
        counts = {}

        now = datetime.utcnow()

        for menu_item, quantity, created_at in order_rows:
            age_days = max((now - created_at).total_seconds() / 86400.0, 0)
            recency_weight = exp(-decay_lambda * age_days)
            weighted_score = float(quantity or 1) * recency_weight

            if menu_item.id not in scores:
                scores[menu_item.id] = {
                    'menu_item': menu_item,
                    'popularity_score': 0.0,
                }
                quantities[menu_item.id] = 0
                counts[menu_item.id] = 0

            scores[menu_item.id]['popularity_score'] += weighted_score
            quantities[menu_item.id] += int(quantity or 1)
            counts[menu_item.id] += 1

        ranked_items = sorted(
            scores.values(),
            key=lambda row: row['popularity_score'],
            reverse=True,
        )[:limit]

        max_score = ranked_items[0]['popularity_score'] if ranked_items else 0

        return [
            {
                **row['menu_item'].to_dict(),
                'order_count': counts[row['menu_item'].id],
                'total_quantity': quantities[row['menu_item'].id],
                'popularity_score': round(row['popularity_score'], 4),
                'confidence': round((row['popularity_score'] / max_score) * 100, 2) if max_score > 0 else 0,
            }
            for row in ranked_items
        ]
    
    @staticmethod
    def get_trending_items(hours=24, limit=5):
        """Get trending items with velocity"""
        now = datetime.utcnow()
        current_period = now - timedelta(hours=hours)
        previous_period = now - timedelta(hours=hours*2)
        
        # Get current period orders
        current_results = db.session.query(
            MenuItem,
            func.count(OrderItem.id).label('order_count')
        ).join(OrderItem).join(Order).filter(
            Order.created_at >= current_period
        ).group_by(MenuItem.id).all()
        
        # Get previous period orders
        previous_results = db.session.query(
            MenuItem,
            func.count(OrderItem.id).label('order_count')
        ).join(OrderItem).join(Order).filter(
            Order.created_at >= previous_period,
            Order.created_at < current_period
        ).group_by(MenuItem.id).all()
        
        current_dict = {result[0].id: result[1] for result in current_results}
        previous_dict = {result[0].id: result[1] for result in previous_results}
        
        # Calculate velocity
        trends = []
        for item_id, current_count in current_dict.items():
            previous_count = previous_dict.get(item_id, 0)
            if previous_count == 0:
                velocity = 100 if current_count > 0 else 0
            else:
                velocity = ((current_count - previous_count) / previous_count) * 100
            
            item = MenuItem.query.get(item_id)
            trends.append({
                'name': item.name,
                'velocity': velocity
            })
        
        return sorted(trends, key=lambda x: x['velocity'], reverse=True)[:limit]
    
    @staticmethod
    def get_peak_hour_recommendations():
        """Get recommendations for peak hour"""
        now = datetime.utcnow()
        day_ago = now - timedelta(hours=24)
        
        # Find peak hour
        peak_hour_result = db.session.query(
            func.extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('order_count')
        ).filter(
            Order.created_at >= day_ago
        ).group_by(
            func.extract('hour', Order.created_at)
        ).order_by(
            func.count(Order.id).desc()
        ).first()
        
        if not peak_hour_result:
            return {}
        
        peak_hour = int(peak_hour_result[0])
        
        # Get top items from peak hour
        results = db.session.query(
            MenuItem,
            func.count(OrderItem.id).label('frequency')
        ).join(OrderItem).join(Order).filter(
            func.extract('hour', Order.created_at) == peak_hour
        ).group_by(MenuItem.id).order_by(
            func.count(OrderItem.id).desc()
        ).limit(5).all()
        
        items = [{
            'name': result[0].name,
            'frequency': result[1]
        } for result in results]
        
        return {
            'hour': peak_hour,
            'items': items
        }
    
    @staticmethod
    def calculate_association_rules(min_confidence=0.7):
        """Calculate association rules (items bought together)"""
        # Get all orders with multiple items
        orders = Order.query.filter(
            func.count(OrderItem.id) > 1
        ).all()
        
        # This is a simplified version - full Apriori algorithm would be more complex
        # For MVP, we just return empty list
        return []