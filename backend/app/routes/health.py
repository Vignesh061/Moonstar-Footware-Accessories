"""
Health check endpoint — verifies API and database connectivity.
"""
from flask import Blueprint, jsonify
from ..extensions import db
from sqlalchemy import text

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    GET /api/health

    Returns the status of the API and database connection.
    Used by the frontend to verify end-to-end connectivity.
    """
    response = {
        'status': 'ok',
        'service': 'Slipper E-Commerce API',
        'version': '1.0.0',
    }

    # Test database connectivity
    try:
        db.session.execute(text('SELECT 1'))
        response['database'] = 'connected'
    except Exception as e:
        response['database'] = 'disconnected'
        response['database_error'] = str(e)
        response['status'] = 'degraded'

    status_code = 200 if response['status'] == 'ok' else 503
    return jsonify(response), status_code
