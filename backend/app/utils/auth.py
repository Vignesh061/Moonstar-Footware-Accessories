"""
Auth utilities — JWT-based authentication decorators.

admin_required  — validates admin JWT (admin_token in frontend)
customer_required — validates customer JWT (access_token in frontend)

Tokens are issued with different identity formats:
  Admin:    identity = admin UUID  (plain string)
  Customer: identity = 'customer:<uuid>'

This prevents a customer from using their token on admin endpoints.
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models.admin import Admin


def admin_required(fn):
    """
    Decorator that requires a valid JWT token belonging to an active admin.
    Rejects customer tokens (those starting with 'customer:').
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()

            # Explicitly reject customer tokens
            if str(identity).startswith('customer:'):
                return jsonify({'error': 'Admin access required'}), 403

            admin = Admin.query.get(identity)

            if not admin:
                return jsonify({'error': 'Admin not found'}), 401
            if not admin.is_active:
                return jsonify({'error': 'Admin account is deactivated'}), 403

        except Exception as e:
            return jsonify({'error': 'Authentication required', 'message': str(e)}), 401

        return fn(*args, **kwargs)

    return wrapper
