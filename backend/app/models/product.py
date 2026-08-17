"""
Product models — Product, ProductImage, ProductAttribute.

Admin-managed only. Customers can browse but not modify.
Products belong to a category and can have multiple images and
flexible key/value attributes (Color, Size, Volume, Material, etc.).
"""
import uuid
import re
from datetime import datetime, timezone
from ..extensions import db


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(220), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    original_price = db.Column(db.Numeric(10, 2), nullable=True)
    discount_percent = db.Column(db.Integer, default=0)
    category_id = db.Column(db.String(36), db.ForeignKey('categories.id'), nullable=True)
    brand = db.Column(db.String(100), nullable=True)
    stock = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    images = db.relationship('ProductImage', backref='product', lazy='select',
                             cascade='all, delete-orphan',
                             order_by='ProductImage.sort_order')
    attributes = db.relationship('ProductAttribute', backref='product', lazy='select',
                                 cascade='all, delete-orphan',
                                 order_by='ProductAttribute.sort_order')

    @staticmethod
    def generate_slug(name):
        """Generate a URL-friendly slug from product name."""
        slug = name.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        return slug.strip('-')

    @property
    def primary_image(self):
        """Return the primary image URL, or first image, or None."""
        for img in self.images:
            if img.is_primary:
                return img.image_url
        return self.images[0].image_url if self.images else None

    def to_dict(self, include_details=False):
        """Serialize product to dict."""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'price': float(self.price),
            'original_price': float(self.original_price) if self.original_price else None,
            'discount_percent': self.discount_percent,
            'image': self.primary_image,
            'category_id': self.category_id,
            'brand': self.brand,
            'stock': self.stock,
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'in_stock': self.stock > 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

        if include_details:
            data['description'] = self.description
            data['images'] = [img.to_dict() for img in self.images]
            data['attributes'] = [a.to_dict() for a in self.attributes]
            data['category'] = self.category.to_dict() if self.category else None
            data['updated_at'] = self.updated_at.isoformat() if self.updated_at else None

        return data

    def __repr__(self):
        return f'<Product {self.name}>'


class ProductImage(db.Model):
    __tablename__ = 'product_images'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey('products.id', ondelete='CASCADE'),
                           nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    alt_text = db.Column(db.String(200), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'alt_text': self.alt_text,
            'sort_order': self.sort_order,
            'is_primary': self.is_primary,
        }

    def __repr__(self):
        return f'<ProductImage {self.product_id}:{self.sort_order}>'


class ProductAttribute(db.Model):
    """
    Flexible product attribute — replaces the rigid size-only variant system.

    Examples:
        attribute_name='Color',    attribute_value='Black'
        attribute_name='Size',     attribute_value='32'
        attribute_name='Material', attribute_value='Leather'
        attribute_name='Volume',   attribute_value='100ml'
        attribute_name='Weight',   attribute_value='50g'
    """
    __tablename__ = 'product_attributes'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = db.Column(db.String(36), db.ForeignKey('products.id', ondelete='CASCADE'),
                           nullable=False)
    attribute_name = db.Column(db.String(100), nullable=False)
    attribute_value = db.Column(db.String(200), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'attribute_name': self.attribute_name,
            'attribute_value': self.attribute_value,
            'sort_order': self.sort_order,
        }

    def __repr__(self):
        return f'<ProductAttribute {self.product_id}:{self.attribute_name}={self.attribute_value}>'
