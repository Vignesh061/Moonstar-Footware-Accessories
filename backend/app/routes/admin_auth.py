"""
Admin Authentication Routes — login and initial admin seed.

POST /api/admin/login — Authenticate admin, return JWT
POST /api/admin/seed  — Create first admin (dev only, one-time)
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from ..models.admin import Admin
from ..extensions import db

admin_auth_bp = Blueprint('admin_auth', __name__)


@admin_auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Authenticate admin with username/password, return JWT token."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    admin = Admin.query.filter_by(username=username).first()

    if not admin or not admin.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401

    if not admin.is_active:
        return jsonify({'error': 'Admin account is deactivated'}), 403

    # Create JWT token with admin ID as identity
    access_token = create_access_token(identity=admin.id)

    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'admin': admin.to_dict(),
    }), 200


@admin_auth_bp.route('/admin/seed', methods=['POST'])
def seed_admin():
    """
    Create the first admin account (development helper).
    Only works if no admins exist yet.
    """
    existing = Admin.query.first()
    if existing:
        return jsonify({'error': 'Admin already exists. Seed is disabled.'}), 400

    data = request.get_json() or {}
    username = data.get('username', 'admin')
    password = data.get('password', 'admin123')
    email = data.get('email', 'admin@moonstar.com')

    admin = Admin(username=username, email=email)
    admin.set_password(password)

    db.session.add(admin)
    db.session.commit()

    return jsonify({
        'message': f'Admin "{username}" created successfully',
        'admin': admin.to_dict(),
    }), 201
