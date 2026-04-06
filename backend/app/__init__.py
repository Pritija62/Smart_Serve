from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions (not bound to app yet)
db = SQLAlchemy()
socketio = SocketIO()


def create_app():
    """Application factory function"""
    app = Flask(__name__)
    
    # Configuration
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL is not set. Point it to your PostgreSQL database.')

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key')
    app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'jwt-key')
    
    # Initialize extensions with app
    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    return app, db, socketio