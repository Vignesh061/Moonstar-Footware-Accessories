"""
Public Product Routes — customer-facing API for browsing products.

No authentication required. Only shows active products/categories.
"""
from flask import Blueprint, request, jsonify
from ..models.product import Product
from ..models.category import Category
from ..utils.helpers import get_pagination_params, paginate_query

public_products_bp = Blueprint('public_products', __name__)


@public_products_bp.route('/products', methods=['GET'])
def list_products():
    """List active products with search, filter, sort, and pagination."""
    search = request.args.get('search', '').strip()
    category_slug = request.args.get('category', '').strip()
    category_id = request.args.get('category_id', '').strip()
    sort = request.args.get('sort', 'newest')
    featured_only = request.args.get('featured', 'false') == 'true'
    page, per_page = get_pagination_params()

    query = Product.query.filter_by(is_active=True)

    # Filter by category slug
    if category_slug:
        category = Category.query.filter_by(slug=category_slug, is_active=True).first()
        if category:
            query = query.filter_by(category_id=category.id)
        else:
            return jsonify({'products': [], 'meta': {'total': 0, 'page': 1,
                                                      'per_page': per_page,
                                                      'pages': 0, 'has_next': False,
                                                      'has_prev': False}}), 200

    # Filter by category_id directly
    if category_id:
        query = query.filter_by(category_id=category_id)

    # Search by name or brand
    if search:
        query = query.filter(
            (Product.name.ilike(f'%{search}%')) |
            (Product.brand.ilike(f'%{search}%'))
        )

    # Featured
    if featured_only:
        query = query.filter_by(is_featured=True)

    # Sorting
    if sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'name':
        query = query.order_by(Product.name.asc())
    elif sort == 'discount':
        query = query.order_by(Product.discount_percent.desc())
    else:  # newest
        query = query.order_by(Product.created_at.desc())

    result = paginate_query(query, page, per_page)

    return jsonify({
        'products': [p.to_dict() for p in result['items']],
        'meta': result['meta'],
    }), 200


@public_products_bp.route('/products/<identifier>', methods=['GET'])
def get_product(identifier):
    """Get a single product by slug or ID (full details)."""
    # Try slug first, then ID
    product = Product.query.filter_by(slug=identifier, is_active=True).first()
    if not product:
        product = Product.query.filter_by(id=identifier, is_active=True).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    return jsonify({'product': product.to_dict(include_details=True)}), 200


@public_products_bp.route('/categories', methods=['GET'])
def list_categories():
    """List all active categories with product counts."""
    categories = Category.query.filter_by(is_active=True).order_by(
        Category.sort_order, Category.name
    ).all()

    return jsonify({
        'categories': [c.to_dict(include_product_count=True) for c in categories],
    }), 200


@public_products_bp.route('/categories/<slug>', methods=['GET'])
def get_category(slug):
    """Get a single category by slug."""
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'category': category.to_dict(include_product_count=True)}), 200


@public_products_bp.route('/categories/<slug>/products', methods=['GET'])
def products_by_category(slug):
    """List active products for a specific category."""
    category = Category.query.filter_by(slug=slug, is_active=True).first()
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    page, per_page = get_pagination_params()
    sort = request.args.get('sort', 'newest')
    search = request.args.get('search', '').strip()
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    in_stock_only = request.args.get('in_stock', 'false') == 'true'

    query = Product.query.filter_by(category_id=category.id, is_active=True)

    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if in_stock_only:
        query = query.filter(Product.stock > 0)

    if sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    elif sort == 'name':
        query = query.order_by(Product.name.asc())
    elif sort == 'discount':
        query = query.order_by(Product.discount_percent.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    result = paginate_query(query, page, per_page)

    return jsonify({
        'category': category.to_dict(),
        'products': [p.to_dict() for p in result['items']],
        'meta': result['meta'],
    }), 200
