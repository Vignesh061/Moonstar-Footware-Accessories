"""
Order models — Order and OrderItem.

Product name and price are stored at purchase time so historical
orders remain correct even if the product is later edited or deleted.
Delivery address is also snapshotted — editing a CustomerProfile
never changes a past order.
"""
import uuid
from datetime import datetime, timezone
from ..extensions import db

# Valid order statuses
ORDER_STATUSES = [
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
]


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)

    # Financials
    subtotal = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    delivery_charge = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)

    # Status
    status = db.Column(db.String(30), nullable=False, default='pending')

    # Delivery snapshot — stored here so profile changes don't affect past orders
    delivery_name = db.Column(db.String(100), nullable=False)
    delivery_mobile = db.Column(db.String(15), nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)   # address_line1
    delivery_address2 = db.Column(db.String(300), nullable=True)  # address_line2
    delivery_landmark = db.Column(db.String(200), nullable=True)
    delivery_city = db.Column(db.String(100), nullable=False)
    delivery_state = db.Column(db.String(100), nullable=False)
    delivery_pincode = db.Column(db.String(10), nullable=False)

    # Customer notes
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy='select',
                            cascade='all, delete-orphan')

    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'customer_id': self.customer_id,
            'subtotal': float(self.subtotal),
            'delivery_charge': float(self.delivery_charge),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'delivery_name': self.delivery_name,
            'delivery_mobile': self.delivery_mobile,
            'delivery_address': self.delivery_address,
            'delivery_address2': self.delivery_address2,
            'delivery_landmark': self.delivery_landmark,
            'delivery_city': self.delivery_city,
            'delivery_state': self.delivery_state,
            'delivery_pincode': self.delivery_pincode,
            'notes': self.notes,
            'item_count': len(self.items),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_items:
            data['items'] = [i.to_dict() for i in self.items]
            if self.customer:
                data['customer'] = self.customer.to_dict()
        return data

    def __repr__(self):
        return f'<Order {self.id[:8]} {self.status}>'


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id', ondelete='CASCADE'),
                         nullable=False)
    product_id = db.Column(db.String(36), nullable=True)  # nullable — product may be deleted

    # Snapshot of product at purchase time
    product_name = db.Column(db.String(200), nullable=False)
    product_image = db.Column(db.String(500), nullable=True)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    # Selected attributes as JSON string e.g. '{"Color":"Black","Size":"32"}'
    selected_attributes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        import json
        attrs = {}
        if self.selected_attributes:
            try:
                attrs = json.loads(self.selected_attributes)
            except Exception:
                attrs = {}
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_image': self.product_image,
            'unit_price': float(self.unit_price),
            'quantity': self.quantity,
            'subtotal': float(self.subtotal),
            'selected_attributes': attrs,
        }

    def __repr__(self):
        return f'<OrderItem {self.product_name} x{self.quantity}>'
