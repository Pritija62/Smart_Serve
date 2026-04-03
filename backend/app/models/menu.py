from datetime import datetime
from app import db


class MenuItem(db.Model):
    """Menu item model"""
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    prep_time = db.Column(db.Integer, nullable=False)  # seconds
    station = db.Column(db.String(20), nullable=False)  # 'grill', 'fry', 'drinks', 'salads'
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='menu_item', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert menu item to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'prep_time': self.prep_time,
            'station': self.station,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat()
        }