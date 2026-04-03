from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import jwt
import os
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def verify_jwt_token():
    """Extract and verify JWT token from request"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return None, None
    
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, os.getenv('JWT_SECRET', 'jwt-key'), algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, {'error': 'Token expired'}, 401
    except jwt.InvalidTokenError:
        return None, {'error': 'Invalid token'}, 401
    except IndexError:
        return None, {'error': 'Invalid authorization header'}, 401


@auth_bp.route('/login', methods=['POST'])
@cross_origin()
def login():
    """Login for kitchen staff or admin"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = user.generate_token()
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/kitchen-login', methods=['POST'])
@cross_origin()
def kitchen_login():
    """Login for kitchen staff only"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if user.role != 'kitchen_staff':
        return jsonify({'error': 'Not authorized'}), 403
    
    token = user.generate_token()
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/admin-login', methods=['POST'])
@cross_origin()
def admin_login():
    """Login for admin only"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if user.role != 'admin':
        return jsonify({'error': 'Not authorized'}), 403
    
    token = user.generate_token()
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@cross_origin()
def get_me():
    """Get current user info"""
    payload, error = verify_jwt_token()
    
    if error:
        if isinstance(error, tuple):
            return jsonify(error[0]), error[1]
        return jsonify(error), 401
    
    user = User.query.get(payload['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200