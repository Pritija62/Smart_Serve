import os
from dotenv import load_dotenv
from app import create_app, db, socketio
from app.models import User, MenuItem, Order, OrderItem, ensure_default_tables
from app.routes import auth_bp, menu_bp, orders_bp, kitchen_bp, admin_bp, tables_bp, analysis_bp
from flask_socketio import join_room, leave_room

load_dotenv()

app, db, socketio = create_app()

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(menu_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(kitchen_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(tables_bp)
app.register_blueprint(analysis_bp)
# Create tables
with app.app_context():
    db.create_all()
    ensure_default_tables()
    print("✅ Database tables created")


# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print("✅ Client connected")
    return True


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print("❌ Client disconnected")


@socketio.on('join_role_room')
def handle_join_role_room(data):
    """Join role-scoped room (kitchen/admin) for targeted updates."""
    role = str((data or {}).get('role', '')).strip().lower()

    if role not in {'kitchen', 'admin'}:
        return {'ok': False, 'error': 'Invalid role room'}

    room_name = f'role_{role}'
    join_room(room_name)
    print(f"✅ Joined room: {room_name}")
    return {'ok': True, 'room': room_name}


@socketio.on('leave_role_room')
def handle_leave_role_room(data):
    """Leave role-scoped room."""
    role = str((data or {}).get('role', '')).strip().lower()

    if role not in {'kitchen', 'admin'}:
        return {'ok': False, 'error': 'Invalid role room'}

    room_name = f'role_{role}'
    leave_room(room_name)
    print(f"↪️ Left room: {room_name}")
    return {'ok': True, 'room': room_name}


@socketio.on('join_order_room')
def handle_join_order_room(data):
    """Join order-specific room for customer tracking page updates."""
    order_id = str((data or {}).get('orderId', '')).strip()

    if not order_id.isdigit():
        return {'ok': False, 'error': 'Invalid order id'}

    room_name = f'order_{order_id}'
    join_room(room_name)
    print(f"✅ Joined room: {room_name}")
    return {'ok': True, 'room': room_name}


@socketio.on('leave_order_room')
def handle_leave_order_room(data):
    """Leave order-specific room."""
    order_id = str((data or {}).get('orderId', '')).strip()

    if not order_id.isdigit():
        return {'ok': False, 'error': 'Invalid order id'}

    room_name = f'order_{order_id}'
    leave_room(room_name)
    print(f"↪️ Left room: {room_name}")
    return {'ok': True, 'room': room_name}


@socketio.on('order_placed')
def handle_order_placed(data):
    """Handle order placed event"""
    print(f"📦 Order placed: {data}")
    socketio.emit('new_order', data, broadcast=True, skip_sid=True)


@socketio.on('order_status_updated')
def handle_order_updated(data):
    """Handle order status update"""
    print(f"✏️ Order updated: {data}")
    socketio.emit('order_status_updated', data, broadcast=True, skip_sid=True)


# Test route
@app.route('/')
def home():
    """Home route"""
    return {
        'message': '✅ Restaurant API is running',
        'version': '1.0.0'
    }


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)