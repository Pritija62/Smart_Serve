from app import db
from app.models import MenuItem, OrderItem, Order
from sqlalchemy import func
from datetime import datetime, timedelta


class RecommendationEngine:
    """Service for generating recommendations"""
    
    @staticmethod
    def get_popular_items(days=7, limit=5):
        """Get top popular items from last N days"""
        days_ago = datetime.utcnow() - timedelta(days=days)
        
        results = db.session.query(
            MenuItem,
            func.count(OrderItem.id).label('order_count')
        ).join(OrderItem).join(Order).filter(
            Order.created_at >= days_ago
        ).group_by(MenuItem.id).order_by(
            func.count(OrderItem.id).desc()
        ).limit(limit).all()
        
        if not results:
            return []
        
        total_count = sum([result[1] for result in results])
        
        items = [{
            'id': result[0].id,
            'name': result[0].name,
            'price': result[0].price,
            'confidence': (result[1] / total_count * 100) if total_count > 0 else 0
        } for result in results]
        
        return items
    
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