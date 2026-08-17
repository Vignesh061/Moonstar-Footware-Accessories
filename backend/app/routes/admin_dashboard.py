"""
Admin Dashboard Routes — statistics and overview data.

GET /api/admin/dashboard — Return business stats
"""
from flask import Blueprint, jsonify
from sqlalchemy import func
from ..models.product import Product
from ..models.category import Category
from ..models.order import Order
from ..models.customer import Customer
from ..extensions import db
from ..utils.auth import admin_required

admin_dashboard_bp = Blueprint('admin_dashboard', __name__)


@admin_dashboard_bp.route('/admin/dashboard', methods=['GET'])
@admin_required
def dashboard_stats():
    """Return dashboard statistics for the admin panel."""
    # Product stats
    total_products = Product.query.count()
    active_products = Product.query.filter_by(is_active=True).count()
    total_categories = Category.query.filter_by(is_active=True).count()
    low_stock = Product.query.filter(
        Product.is_active == True,  # noqa: E712
        Product.stock < 10
    ).count()
    out_of_stock = Product.query.filter(
        Product.is_active == True,  # noqa: E712
        Product.stock == 0
    ).count()
    featured_products = Product.query.filter_by(is_featured=True, is_active=True).count()

    # Order stats
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status='pending').count()
    delivered_orders = Order.query.filter_by(status='delivered').count()

    # Revenue from delivered orders
    revenue_row = db.session.query(
        func.sum(Order.total_amount)
    ).filter(Order.status == 'delivered').scalar()
    total_revenue = float(revenue_row) if revenue_row else 0.0

    # Customers
    total_customers = Customer.query.filter_by(is_active=True).count()

    # Low stock products list
    low_stock_products = Product.query.filter(
        Product.is_active == True,  # noqa: E712
        Product.stock < 10
    ).order_by(Product.stock).limit(10).all()

    # Recent products
    recent_products = Product.query.filter_by(is_active=True).order_by(
        Product.created_at.desc()
    ).limit(5).all()

    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()

    return jsonify({
        'stats': {
            'total_products': total_products,
            'active_products': active_products,
            'total_categories': total_categories,
            'low_stock_count': low_stock,
            'out_of_stock_count': out_of_stock,
            'featured_products': featured_products,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'delivered_orders': delivered_orders,
            'total_revenue': total_revenue,
            'total_customers': total_customers,
        },
        'low_stock_products': [p.to_dict() for p in low_stock_products],
        'recent_products': [p.to_dict() for p in recent_products],
        'recent_orders': [o.to_dict() for o in recent_orders],
    }), 200
