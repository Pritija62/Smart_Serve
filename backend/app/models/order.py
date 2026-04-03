from datetime import datetime
from app import db
import uuid


class Order(db.Model):
    """Order model for customer orders"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Anonymous orders
    table_number = db.Column(db.String(10))
    status = db.Column(db.String(20), default='pending')  # 'pending', 'preparing', 'ready', 'completed'
    total_price = db.Column(db.Float, default=0)
    estimated_wait_time = db.Column(db.Integer, default=0)  # seconds
    tracking_token = db.Column(db.String(50), unique=True)  # For public tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='orders', lazy=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.tracking_token:
            self.tracking_token = uuid.uuid4().hex
    
    def to_dict(self):
        """Convert order to dictionary"""
        return {
            'id': self.id,
            'table_number': self.table_number,
            'status': self.status,
            'total_price': self.total_price,
            'estimated_wait_time': self.estimated_wait_time,
            'tracking_token': self.tracking_token,
            'order_items': [item.to_dict() for item in self.order_items],
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class OrderItem(db.Model):
    """Order item model (items in an order)"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    special_instructions = db.Column(db.Text)
    
    def to_dict(self):
        """Convert order item to dictionary"""
        return {
            'id': self.id,
            'menu_item': self.menu_item.to_dict(),
            'quantity': self.quantity,
            'special_instructions': self.special_instructions
        }