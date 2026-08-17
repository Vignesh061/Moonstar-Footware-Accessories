"""
Database models package.
Import all models here so Flask-Migrate can detect them.
"""
from .admin import Admin  # noqa: F401
from .category import Category  # noqa: F401
from .product import Product, ProductImage, ProductAttribute  # noqa: F401
from .customer import Customer, CustomerProfile, OTPVerification  # noqa: F401
from .order import Order, OrderItem  # noqa: F401
