"""
Admin Category Routes — CRUD for product categories.

All endpoints require admin authentication.
"""
from flask import Blueprint, request, jsonify
from ..models.category import Category
from ..extensions import db
from ..utils.auth import admin_required
from ..utils.helpers import get_pagination_params, paginate_query

admin_categories_bp = Blueprint('admin_categories', __name__)


@admin_categories_bp.route('/admin/categories', methods=['GET'])
@admin_required
def list_categories():
    """List all categories with optional search and pagination."""
    search = request.args.get('search', '').strip()
    show_inactive = request.args.get('show_inactive', 'false') == 'true'
    page, per_page = get_pagination_params()

    query = Category.query

    if not show_inactive:
        query = query.filter_by(is_active=True)

    if search:
        query = query.filter(Category.name.ilike(f'%{search}%'))

    query = query.order_by(Category.sort_order, Category.name)

    result = paginate_query(query, page, per_page)

    return jsonify({
        'categories': [c.to_dict(include_product_count=True) for c in result['items']],
        'meta': result['meta'],
    }), 200


@admin_categories_bp.route('/admin/categories', methods=['POST'])
@admin_required
def create_category():
    """Create a new category."""
    data = request.get_json()

    if not data or not data.get('name', '').strip():
        return jsonify({'error': 'Category name is required'}), 400

    name = data['name'].strip()
    slug = Category.generate_slug(name)

    # Check for duplicate slug
    existing = Category.query.filter_by(slug=slug).first()
    if existing:
        return jsonify({'error': f'Category with slug "{slug}" already exists'}), 409

    category = Category(
        name=name,
        slug=slug,
        description=data.get('description', '').strip() or None,
        image_url=data.get('image_url'),
        is_active=data.get('is_active', True),
        sort_order=data.get('sort_order', 0),
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict(),
    }), 201


@admin_categories_bp.route('/admin/categories/<category_id>', methods=['GET'])
@admin_required
def get_category(category_id):
    """Get a single category by ID."""
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    return jsonify({'category': category.to_dict(include_product_count=True)}), 200


@admin_categories_bp.route('/admin/categories/<category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    """Update an existing category."""
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Update fields
    if 'name' in data and data['name'].strip():
        category.name = data['name'].strip()
        new_slug = Category.generate_slug(category.name)
        # Check slug uniqueness
        existing = Category.query.filter(
            Category.slug == new_slug,
            Category.id != category_id
        ).first()
        if existing:
            return jsonify({'error': f'Category with slug "{new_slug}" already exists'}), 409
        category.slug = new_slug

    if 'description' in data:
        category.description = data['description'].strip() if data['description'] else None
    if 'image_url' in data:
        category.image_url = data['image_url']
    if 'is_active' in data:
        category.is_active = bool(data['is_active'])
    if 'sort_order' in data:
        category.sort_order = int(data['sort_order'])

    db.session.commit()

    return jsonify({
        'message': 'Category updated successfully',
        'category': category.to_dict(),
    }), 200


@admin_categories_bp.route('/admin/categories/<category_id>', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    """Soft-delete a category (set is_active to False)."""
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    # Check if category has active products
    active_products = category.products.filter_by(is_active=True).count()
    if active_products > 0:
        return jsonify({
            'error': f'Cannot delete category with {active_products} active products. '
                     f'Deactivate or reassign products first.'
        }), 409

    category.is_active = False
    db.session.commit()

    return jsonify({'message': 'Category deactivated successfully'}), 200
