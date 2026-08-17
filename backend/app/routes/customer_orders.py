"""
Customer Order Routes — place and view orders.

All endpoints require customer JWT (access_token with 'customer:' prefix).
Customers can only see their own orders — backend enforces this.
"""
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from ..models.order import Order, OrderItem, ORDER_STATUSES
from ..models.product import Product
from ..models.customer import Customer
from ..extensions import db
from ..utils.helpers import get_pagination_params, paginate_query

customer_orders_bp = Blueprint('customer_orders', __name__)


def _get_current_customer():
    """Verify customer JWT → return (customer, None) or (None, error)."""
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        if not identity or not str(identity).startswith('customer:'):
            return None, (jsonify({'error': 'Customer authentication required'}), 401)
        cid = str(identity).split('customer:')[1]
        customer = Customer.query.get(cid)
        if not customer or not customer.is_active:
            return None, (jsonify({'error': 'Customer not found'}), 401)
        return customer, None
    except Exception as e:
        return None, (jsonify({'error': 'Authentication required', 'message': str(e)}), 401)


@customer_orders_bp.route('/orders', methods=['POST'])
def place_order():
    """
    Place a new order.

    Body:
    {
      "delivery": {
        "name": "...", "mobile": "...",
        "address_line1": "...", "address_line2": "...",   # line2 optional
        "landmark": "...",                                  # optional
        "city": "...", "state": "...", "pincode": "..."
      },
      "items": [
        {"product_id":"...","quantity":1,"selected_attributes":{}}
      ],
      "notes": ""   // optional
    }
    """
    customer, err = _get_current_customer()
    if err:
        return err

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    delivery = data.get('delivery', {})

    # Validate required delivery fields
    required = ['name', 'mobile', 'address_line1', 'city', 'state', 'pincode']
    for field in required:
        val = str(delivery.get(field, '')).strip()
        if not val:
            return jsonify({'error': f'Delivery {field} is required'}), 400

    # Validate mobile (10 digits)
    mobile = str(delivery.get('mobile', '')).replace(' ', '').replace('-', '')
    if not mobile.isdigit() or len(mobile) != 10:
        return jsonify({'error': 'Delivery mobile must be a 10-digit number'}), 400

    # Validate pincode (6 digits)
    pincode = str(delivery.get('pincode', '')).strip()
    if not pincode.isdigit() or len(pincode) != 6:
        return jsonify({'error': 'Delivery pincode must be a 6-digit number'}), 400

    items_data = data.get('items', [])
    if not items_data:
        return jsonify({'error': 'Order must have at least one item'}), 400

    # Build order items, validate stock
    order_items = []
    subtotal = 0.0

    for item_data in items_data:
        product_id = item_data.get('product_id')
        try:
            qty = int(item_data.get('quantity', 1))
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid quantity'}), 400

        if qty < 1:
            return jsonify({'error': 'Quantity must be at least 1'}), 400

        product = Product.query.filter_by(id=product_id, is_active=True).first()
        if not product:
            return jsonify({'error': f'Product not found or unavailable'}), 404

        if product.stock < qty:
            return jsonify({
                'error': f'Insufficient stock for "{product.name}". '
                         f'Only {product.stock} item(s) available.'
            }), 400

        line_total = float(product.price) * qty
        subtotal += line_total

        selected_attrs = item_data.get('selected_attributes', {})
        if not isinstance(selected_attrs, dict):
            selected_attrs = {}

        order_items.append({
            'product': product,
            'product_id': product.id,
            'product_name': product.name,
            'product_image': product.primary_image,
            'unit_price': float(product.price),
            'quantity': qty,
            'subtotal': line_total,
            'selected_attributes': json.dumps(selected_attrs),
        })

    # Delivery charge: free above ₹499
    delivery_charge = 0.0 if subtotal >= 499 else 50.0
    total_amount = subtotal + delivery_charge

    order = Order(
        customer_id=customer.id,
        subtotal=subtotal,
        delivery_charge=delivery_charge,
        total_amount=total_amount,
        status='pending',
        delivery_name=str(delivery['name']).strip(),
        delivery_mobile=mobile,
        delivery_address=str(delivery['address_line1']).strip(),
        delivery_address2=str(delivery.get('address_line2', '') or '').strip() or None,
        delivery_landmark=str(delivery.get('landmark', '') or '').strip() or None,
        delivery_city=str(delivery['city']).strip(),
        delivery_state=str(delivery['state']).strip(),
        delivery_pincode=pincode,
        notes=str(data.get('notes', '') or '').strip() or None,
    )
    db.session.add(order)
    db.session.flush()  # get order.id

    for item in order_items:
        product = item.pop('product')
        product.stock -= item['quantity']
        db.session.add(OrderItem(order_id=order.id, **item))

    db.session.commit()

    return jsonify({
        'message': 'Order placed successfully',
        'order': order.to_dict(include_items=True),
    }), 201


@customer_orders_bp.route('/orders', methods=['GET'])
def list_orders():
    """List all orders for the current customer (newest first)."""
    customer, err = _get_current_customer()
    if err:
        return err

    page, per_page = get_pagination_params()
    query = Order.query.filter_by(customer_id=customer.id).order_by(Order.created_at.desc())
    result = paginate_query(query, page, per_page)

    return jsonify({
        'orders': [o.to_dict() for o in result['items']],
        'meta': result['meta'],
    }), 200


@customer_orders_bp.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """Get a specific order. Enforces ownership — customers can only see their own orders."""
    customer, err = _get_current_customer()
    if err:
        return err

    order = Order.query.filter_by(id=order_id, customer_id=customer.id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'order': order.to_dict(include_items=True)}), 200
