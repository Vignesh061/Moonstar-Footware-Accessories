"""
Admin Order Routes — view and manage all customer orders.

All endpoints require admin authentication.
Admins can view all orders and update their status.
"""
from flask import Blueprint, request, jsonify
from ..models.order import Order, ORDER_STATUSES
from ..models.customer import Customer
from ..extensions import db
from ..utils.auth import admin_required
from ..utils.helpers import get_pagination_params, paginate_query

admin_orders_bp = Blueprint('admin_orders', __name__)


@admin_orders_bp.route('/admin/orders', methods=['GET'])
@admin_required
def list_orders():
    """
    List all orders with optional status filter and pagination.
    Query params: status, page, per_page, search (customer mobile/name)
    """
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()
    page, per_page = get_pagination_params()

    query = Order.query

    if status and status in ORDER_STATUSES:
        query = query.filter_by(status=status)

    if search:
        # Join with customer to search by mobile or name
        query = query.join(Customer, Order.customer_id == Customer.id).filter(
            (Customer.mobile.ilike(f'%{search}%')) |
            (Customer.name.ilike(f'%{search}%')) |
            (Order.delivery_name.ilike(f'%{search}%'))
        )

    query = query.order_by(Order.created_at.desc())
    result = paginate_query(query, page, per_page)

    return jsonify({
        'orders': [o.to_dict() for o in result['items']],
        'meta': result['meta'],
        'statuses': ORDER_STATUSES,
    }), 200


@admin_orders_bp.route('/admin/orders/<order_id>', methods=['GET'])
@admin_required
def get_order(order_id):
    """Get full order details including items and customer info."""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'order': order.to_dict(include_items=True)}), 200


@admin_orders_bp.route('/admin/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    """
    Update the status of an order.
    Only admins can change order status — customers cannot.
    """
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    new_status = str(data.get('status', '')).strip().lower()
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400

    if new_status not in ORDER_STATUSES:
        return jsonify({
            'error': f'Invalid status. Valid values: {", ".join(ORDER_STATUSES)}'
        }), 400

    old_status = order.status
    order.status = new_status
    db.session.commit()

    return jsonify({
        'message': f'Order status updated from {old_status} to {new_status}',
        'order': order.to_dict(),
    }), 200


@admin_orders_bp.route('/admin/orders/stats', methods=['GET'])
@admin_required
def order_stats():
    """Return order statistics for the dashboard."""
    from sqlalchemy import func
    from ..extensions import db

    total = Order.query.count()
    pending = Order.query.filter_by(status='pending').count()
    confirmed = Order.query.filter_by(status='confirmed').count()
    delivered = Order.query.filter_by(status='delivered').count()
    cancelled = Order.query.filter_by(status='cancelled').count()

    # Total revenue from delivered orders
    revenue_row = db.session.query(
        func.sum(Order.total_amount)
    ).filter(Order.status == 'delivered').scalar()
    total_revenue = float(revenue_row) if revenue_row else 0.0

    # Total customers
    total_customers = Customer.query.filter_by(is_active=True).count()

    return jsonify({
        'total_orders': total,
        'pending_orders': pending,
        'confirmed_orders': confirmed,
        'delivered_orders': delivered,
        'cancelled_orders': cancelled,
        'total_revenue': total_revenue,
        'total_customers': total_customers,
    }), 200
