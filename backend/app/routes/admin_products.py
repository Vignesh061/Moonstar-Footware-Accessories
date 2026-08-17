"""
Admin Product Routes — Full CRUD for products with image upload.

All endpoints require admin authentication.
Products are admin-managed only — customers use the public API to browse.

product_attributes replaces the old product_variants table:
  attribute_name = 'Color', attribute_value = 'Black'
  attribute_name = 'Size',  attribute_value = '32'
  etc.
"""
import os
import uuid
from flask import Blueprint, request, jsonify
from ..models.product import Product, ProductImage, ProductAttribute
from ..models.category import Category
from ..extensions import db
from ..utils.auth import admin_required
from ..utils.helpers import get_pagination_params, paginate_query
from ..services.storage import upload_image, delete_image

admin_products_bp = Blueprint('admin_products', __name__)


@admin_products_bp.route('/admin/products', methods=['GET'])
@admin_required
def list_products():
    """List all products with search, filter, and pagination."""
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id', '').strip()
    show_inactive = request.args.get('show_inactive', 'false') == 'true'
    low_stock = request.args.get('low_stock', 'false') == 'true'
    page, per_page = get_pagination_params()

    query = Product.query

    if not show_inactive:
        query = query.filter_by(is_active=True)
    if category_id:
        query = query.filter_by(category_id=category_id)
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    if low_stock:
        query = query.filter(Product.stock < 10)

    query = query.order_by(Product.created_at.desc())
    result = paginate_query(query, page, per_page)

    return jsonify({
        'products': [p.to_dict() for p in result['items']],
        'meta': result['meta'],
    }), 200


@admin_products_bp.route('/admin/products/<product_id>', methods=['GET'])
@admin_required
def get_product(product_id):
    """Get a single product with full details (images, attributes)."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    return jsonify({'product': product.to_dict(include_details=True)}), 200


@admin_products_bp.route('/admin/products', methods=['POST'])
@admin_required
def create_product():
    """
    Create a new product with optional attributes.
    Images are uploaded separately via the image upload endpoint.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Validate required fields
    name = data.get('name', '').strip()
    price = data.get('price')

    if not name:
        return jsonify({'error': 'Product name is required'}), 400
    if price is None:
        return jsonify({'error': 'Product price is required'}), 400

    try:
        price = float(price)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid price value'}), 400

    if price <= 0:
        return jsonify({'error': 'Price must be greater than 0'}), 400

    # Validate category if provided
    category_id = data.get('category_id')
    if category_id:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404

    # Generate unique slug
    slug = Product.generate_slug(name)
    existing = Product.query.filter_by(slug=slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    # Calculate discount — never trust frontend discount value
    original_price = data.get('original_price')
    discount_percent = 0
    if original_price:
        try:
            original_price = float(original_price)
            if original_price > price:
                discount_percent = round(
                    ((original_price - price) / original_price) * 100
                )
        except (TypeError, ValueError):
            original_price = None

    stock = data.get('stock', 0)
    try:
        stock = int(stock)
    except (TypeError, ValueError):
        stock = 0

    product = Product(
        name=name,
        slug=slug,
        description=data.get('description', '').strip() or None,
        price=price,
        original_price=original_price,
        discount_percent=discount_percent,
        category_id=category_id,
        brand=data.get('brand', '').strip() or None,
        stock=stock,
        is_active=bool(data.get('is_active', True)),
        is_featured=bool(data.get('is_featured', False)),
    )

    db.session.add(product)

    # Create attributes if provided
    # Expected format: [{"attribute_name": "Color", "attribute_value": "Black"}, ...]
    attributes = data.get('attributes', [])
    for i, attr in enumerate(attributes):
        attr_name = str(attr.get('attribute_name', '')).strip()
        attr_value = str(attr.get('attribute_value', '')).strip()
        if attr_name and attr_value:
            db.session.add(ProductAttribute(
                product=product,
                attribute_name=attr_name,
                attribute_value=attr_value,
                sort_order=i,
            ))

    db.session.commit()

    return jsonify({
        'message': 'Product created successfully',
        'product': product.to_dict(include_details=True),
    }), 201


@admin_products_bp.route('/admin/products/<product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    """Update an existing product."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Update basic fields
    if 'name' in data and str(data['name']).strip():
        product.name = str(data['name']).strip()
        new_slug = Product.generate_slug(product.name)
        existing = Product.query.filter(
            Product.slug == new_slug,
            Product.id != product_id
        ).first()
        if existing:
            new_slug = f"{new_slug}-{uuid.uuid4().hex[:6]}"
        product.slug = new_slug

    if 'description' in data:
        product.description = str(data['description']).strip() or None
    if 'brand' in data:
        product.brand = str(data['brand']).strip() or None
    if 'price' in data:
        try:
            product.price = float(data['price'])
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid price value'}), 400
    if 'original_price' in data:
        try:
            op = data['original_price']
            product.original_price = float(op) if op else None
        except (TypeError, ValueError):
            product.original_price = None
    if 'category_id' in data:
        product.category_id = data['category_id'] or None
    if 'stock' in data:
        try:
            product.stock = int(data['stock'])
        except (TypeError, ValueError):
            pass
    if 'is_active' in data:
        product.is_active = bool(data['is_active'])
    if 'is_featured' in data:
        product.is_featured = bool(data['is_featured'])

    # Recalculate discount — always from price/original_price, never from frontend
    if (product.original_price and product.price and
            float(product.original_price) > float(product.price)):
        product.discount_percent = round(
            ((float(product.original_price) - float(product.price)) /
             float(product.original_price)) * 100
        )
    else:
        product.discount_percent = 0

    # Replace attributes if provided
    if 'attributes' in data:
        ProductAttribute.query.filter_by(product_id=product_id).delete()
        for i, attr in enumerate(data['attributes']):
            attr_name = str(attr.get('attribute_name', '')).strip()
            attr_value = str(attr.get('attribute_value', '')).strip()
            if attr_name and attr_value:
                db.session.add(ProductAttribute(
                    product=product,
                    attribute_name=attr_name,
                    attribute_value=attr_value,
                    sort_order=i,
                ))

    db.session.commit()

    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict(include_details=True),
    }), 200


@admin_products_bp.route('/admin/products/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    """Soft-delete a product (set is_active=False)."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    product.is_active = False
    db.session.commit()

    return jsonify({'message': 'Product deactivated successfully'}), 200


# ── Image Endpoints ──────────────────────────────────────────────────────────

@admin_products_bp.route('/admin/products/<product_id>/images', methods=['POST'])
@admin_required
def upload_product_image(product_id):
    """Upload an image for a product to Supabase Storage."""
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    allowed = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        return jsonify({
            'error': f'File type {ext} not allowed. Use: {", ".join(allowed)}'
        }), 400

    try:
        result = upload_image(file, file.filename, folder=f'products/{product_id}')

        is_primary = request.form.get('is_primary', 'false') == 'true'
        if is_primary:
            ProductImage.query.filter_by(
                product_id=product_id, is_primary=True
            ).update({'is_primary': False})

        existing_count = ProductImage.query.filter_by(product_id=product_id).count()
        if existing_count == 0:
            is_primary = True

        image = ProductImage(
            product_id=product_id,
            image_url=result['url'],
            alt_text=request.form.get('alt_text', product.name),
            sort_order=existing_count,
            is_primary=is_primary,
        )
        # Store storage path for potential deletion
        image.__dict__['_storage_path'] = result.get('path', '')

        db.session.add(image)
        db.session.commit()

        return jsonify({
            'message': 'Image uploaded successfully',
            'image': image.to_dict(),
        }), 201

    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@admin_products_bp.route('/admin/products/<product_id>/images/<image_id>', methods=['DELETE'])
@admin_required
def delete_product_image(product_id, image_id):
    """Delete a product image from storage and database."""
    image = ProductImage.query.filter_by(
        id=image_id, product_id=product_id
    ).first()
    if not image:
        return jsonify({'error': 'Image not found'}), 404

    # Attempt storage deletion (non-blocking)
    # We try to infer the storage path from the URL
    try:
        url = image.image_url
        bucket_name = 'product-images'
        # Extract path after bucket segment
        if f'/{bucket_name}/' in url:
            storage_path = url.split(f'/{bucket_name}/')[1].split('?')[0]
            delete_image(storage_path)
    except Exception:
        pass

    db.session.delete(image)
    db.session.commit()

    return jsonify({'message': 'Image deleted successfully'}), 200
