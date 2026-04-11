from flask import Blueprint, jsonify
from flask_cors import cross_origin

from app.models import DiningTable

tables_bp = Blueprint('tables', __name__, url_prefix='/api/tables')


@tables_bp.route('/', methods=['GET'])
@cross_origin()
def get_tables():
    """Get all active restaurant tables."""
    tables = DiningTable.query.filter_by(is_active=True).order_by(DiningTable.number.asc()).all()
    return jsonify([table.to_dict() for table in tables]), 200