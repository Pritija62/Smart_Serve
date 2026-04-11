from .auth import auth_bp
from .menu import menu_bp
from .orders import orders_bp
from .kitchen import kitchen_bp
from .admin import admin_bp
from .tables import tables_bp
from .analysis import analysis_bp

__all__ = ['auth_bp', 'menu_bp', 'orders_bp', 'kitchen_bp', 'admin_bp', 'analysis_bp']