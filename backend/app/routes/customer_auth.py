"""
Customer Authentication Routes — Email + Password + Google OAuth.

POST /api/auth/register   — Create new customer account
POST /api/auth/login      — Sign in with email + password
POST /api/auth/google     — Sign in / register with Google OAuth token
GET  /api/auth/me         — Get current customer + profile
PUT  /api/auth/me         — Update name / mobile
GET  /api/auth/profile    — Get saved delivery address
PUT  /api/auth/profile    — Save / update delivery address
"""
import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, verify_jwt_in_request, get_jwt_identity
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..models.customer import Customer, CustomerProfile
from ..extensions import db

customer_auth_bp = Blueprint('customer_auth', __name__)

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


# ── Helpers ───────────────────────────────────────────────────────────────────

def _customer_required():
    """Verify JWT → return (customer, None) or (None, error_response)."""
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if not identity or not str(identity).startswith('customer:'):
            return None, (jsonify({'error': 'Customer token required'}), 401)
        cid = str(identity).split('customer:')[1]
        customer = Customer.query.get(cid)
        if not customer or not customer.is_active:
            return None, (jsonify({'error': 'Account not found'}), 401)
        return customer, None
    except Exception as e:
        return None, (jsonify({'error': 'Authentication required', 'message': str(e)}), 401)


def _make_token(customer):
    return create_access_token(identity=f'customer:{customer.id}')


# ── Register ──────────────────────────────────────────────────────────────────

@customer_auth_bp.route('/auth/register', methods=['POST'])
def register():
    """
    Create a new customer account.

    Body: { "name": "...", "email": "...", "password": "...", "mobile": "..." (optional) }

    Rules:
      - email must be unique
      - password must be at least 6 characters
      - name is required
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    mobile = str(data.get('mobile', '')).strip().replace(' ', '') or None

    # Validate
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email or not EMAIL_RE.match(email):
        return jsonify({'error': 'Enter a valid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if mobile and (not mobile.isdigit() or len(mobile) != 10):
        return jsonify({'error': 'Mobile must be a 10-digit number'}), 400

    # Duplicate check
    if Customer.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409
    if mobile and Customer.query.filter_by(mobile=mobile).first():
        return jsonify({'error': 'An account with this mobile number already exists'}), 409

    customer = Customer(name=name, email=email, mobile=mobile, is_active=True)
    customer.set_password(password)
    db.session.add(customer)
    db.session.commit()

    access_token = _make_token(customer)
    return jsonify({
        'message': 'Account created successfully',
        'access_token': access_token,
        'customer': customer.to_dict(),
        'profile': None,
        'is_new_customer': True,
    }), 201


# ── Login ─────────────────────────────────────────────────────────────────────

@customer_auth_bp.route('/auth/login', methods=['POST'])
def login():
    """
    Sign in with email + password.

    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    customer = Customer.query.filter_by(email=email).first()

    # Generic message — don't reveal whether email exists
    if not customer or not customer.check_password(password):
        return jsonify({'error': 'Incorrect email or password'}), 401

    if customer.is_active is False:
        return jsonify({'error': 'Account is deactivated. Please contact support.'}), 403

    access_token = _make_token(customer)
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'customer': customer.to_dict(),
        'profile': customer.profile.to_dict() if customer.profile else None,
        'is_new_customer': False,
    }), 200


# ── Google OAuth ─────────────────────────────────────────────────────────────

@customer_auth_bp.route('/auth/google', methods=['POST'])
def google_auth():
    """
    Sign in / register using Google.

    Accepts two modes:
    1. credential (ID token from one-tap / button flow): { "credential": "..." }
    2. userinfo   (from implicit flow):                  { "userinfo": {...} }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    email = None
    name = None

    if data.get('credential'):
        # ── Mode 1: Verify Google ID token ────────────────────────────────
        google_client_id = current_app.config.get('GOOGLE_CLIENT_ID', '')
        if not google_client_id:
            return jsonify({'error': 'Google OAuth is not configured on the server'}), 500
        try:
            id_info = id_token.verify_oauth2_token(
                data['credential'],
                google_requests.Request(),
                google_client_id,
                clock_skew_in_seconds=10,
            )
            email = id_info.get('email', '').lower().strip()
            name = id_info.get('name', '').strip()
        except ValueError as e:
            current_app.logger.warning(f'Google token verification failed: {e}')
            return jsonify({'error': 'Invalid Google token. Please try again.'}), 401

    elif data.get('userinfo'):
        # ── Mode 2: Trust userinfo fetched from Google's /userinfo endpoint
        info = data['userinfo']
        current_app.logger.info(f'Google userinfo received: {info}')
        email = str(info.get('email', '')).lower().strip()
        name = str(info.get('name', '')).strip()
        # Only accept verified emails
        if info.get('email_verified') is False:
            return jsonify({'error': 'Google email is not verified'}), 400

    if not email:
        return jsonify({'error': 'Could not retrieve email from Google account'}), 400

    # Find or create customer
    customer = Customer.query.filter_by(email=email).first()
    is_new = False
    if not customer:
        customer = Customer(email=email, name=name or None, is_active=True)
        db.session.add(customer)
        db.session.flush()  # get ID without full commit
        is_new = True
    else:
        if not customer.name and name:
            customer.name = name
        # Only block explicitly deactivated accounts (is_active explicitly False)
        if customer.is_active is False:
            return jsonify({'error': 'Account is deactivated. Please contact support.'}), 403

    db.session.commit()

    access_token = _make_token(customer)
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'customer': customer.to_dict(),
        'profile': customer.profile.to_dict() if customer.profile else None,
        'is_new_customer': is_new,
    }), 200


# ── Me ────────────────────────────────────────────────────────────────────────

@customer_auth_bp.route('/auth/me', methods=['GET'])
def get_me():
    """Return current customer + saved delivery profile."""
    customer, err = _customer_required()
    if err:
        return err
    return jsonify({
        'customer': customer.to_dict(),
        'profile': customer.profile.to_dict() if customer.profile else None,
    }), 200


@customer_auth_bp.route('/auth/me', methods=['PUT'])
def update_me():
    """Update customer name and/or mobile."""
    customer, err = _customer_required()
    if err:
        return err

    data = request.get_json() or {}

    if 'name' in data:
        customer.name = str(data['name']).strip() or None

    if 'mobile' in data:
        mob = str(data['mobile']).strip().replace(' ', '')
        if mob:
            if not mob.isdigit() or len(mob) != 10:
                return jsonify({'error': 'Mobile must be a 10-digit number'}), 400
            # Check uniqueness (ignore current customer)
            existing = Customer.query.filter(
                Customer.mobile == mob,
                Customer.id != customer.id
            ).first()
            if existing:
                return jsonify({'error': 'Mobile number already in use'}), 409
            customer.mobile = mob
        else:
            customer.mobile = None

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'customer': customer.to_dict()}), 200


# ── Delivery Profile ──────────────────────────────────────────────────────────

@customer_auth_bp.route('/auth/profile', methods=['GET'])
def get_delivery_profile():
    """Return the saved delivery address."""
    customer, err = _customer_required()
    if err:
        return err
    return jsonify({
        'profile': customer.profile.to_dict() if customer.profile else None
    }), 200


@customer_auth_bp.route('/auth/profile', methods=['PUT'])
def save_delivery_profile():
    """Create or update delivery address (upsert)."""
    customer, err = _customer_required()
    if err:
        return err

    data = request.get_json() or {}

    profile = customer.profile
    if not profile:
        profile = CustomerProfile(customer_id=customer.id)
        db.session.add(profile)

    for key in ('name', 'address_line1', 'address_line2', 'landmark',
                'city', 'state', 'pincode'):
        if key in data:
            setattr(profile, key, str(data[key]).strip() or None)

    # Keep Customer.name in sync
    if 'name' in data and data['name']:
        customer.name = str(data['name']).strip()

    db.session.commit()
    return jsonify({'message': 'Profile saved', 'profile': profile.to_dict()}), 200
