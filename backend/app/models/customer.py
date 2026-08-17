"""
Customer models — Customer, CustomerProfile.

Customers authenticate via email + password.
OTPVerification table is kept for backwards compatibility but no longer used.
"""
import uuid
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db


class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    mobile = db.Column(db.String(15), unique=True, nullable=True, index=True)
    name = db.Column(db.String(100), nullable=True)
    password_hash = db.Column(db.String(256), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    orders = db.relationship('Order', backref='customer', lazy='dynamic')
    profile = db.relationship(
        'CustomerProfile', backref='customer', uselist=False,
        cascade='all, delete-orphan'
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'mobile': self.mobile,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def to_dict_with_profile(self):
        d = self.to_dict()
        d['profile'] = self.profile.to_dict() if self.profile else None
        return d

    def __repr__(self):
        return f'<Customer {self.email or self.mobile}>'


class CustomerProfile(db.Model):
    """
    Saved delivery address for a customer.
    One-to-one with Customer.
    Orders snapshot this at purchase time — editing the profile
    never changes historical orders.
    """
    __tablename__ = 'customer_profiles'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(
        db.String(36),
        db.ForeignKey('customers.id', ondelete='CASCADE'),
        unique=True, nullable=False, index=True
    )

    name = db.Column(db.String(100), nullable=True)
    address_line1 = db.Column(db.String(300), nullable=True)
    address_line2 = db.Column(db.String(300), nullable=True)
    landmark = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    pincode = db.Column(db.String(10), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'name': self.name,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'landmark': self.landmark,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<CustomerProfile {self.customer_id}>'


class OTPVerification(db.Model):
    """Kept for DB compatibility — no longer used in auth flow."""
    __tablename__ = 'otp_verifications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mobile = db.Column(db.String(15), nullable=False, index=True)
    otp_code = db.Column(db.String(10), nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
