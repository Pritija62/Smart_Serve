from datetime import datetime, timedelta
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os


class User(db.Model):
    """User model for kitchen staff and admin"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'kitchen_staff' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and store password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }
    
    def generate_token(self):
        """Generate JWT token"""
        payload = {
            'user_id': self.id,
            'email': self.email,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, os.getenv('JWT_SECRET', 'jwt-key'), algorithm='HS256')
        return token
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET', 'jwt-key'), algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None