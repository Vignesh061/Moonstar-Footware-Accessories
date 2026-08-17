"""
Helper utilities — shared functions used across the application.
"""
import re
from flask import request


def slugify(text):
    """Convert text to a URL-friendly slug."""
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def get_pagination_params():
    """Extract pagination parameters from request query string."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Clamp values
    page = max(1, page)
    per_page = min(max(1, per_page), 100)

    return page, per_page


def paginate_query(query, page, per_page):
    """Apply pagination to a SQLAlchemy query and return data + meta."""
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': pagination.items,
        'meta': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        }
    }
