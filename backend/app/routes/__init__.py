"""
Blueprint registration — all route blueprints are imported and registered here.
"""


def register_routes(app):
    """Register all API blueprints with the Flask app."""
    from .health import health_bp
    from .admin_auth import admin_auth_bp
    from .admin_categories import admin_categories_bp
    from .admin_products import admin_products_bp
    from .admin_dashboard import admin_dashboard_bp
    from .admin_orders import admin_orders_bp
    from .public_products import public_products_bp
    from .customer_auth import customer_auth_bp
    from .customer_orders import customer_orders_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(admin_auth_bp, url_prefix='/api')
    app.register_blueprint(admin_categories_bp, url_prefix='/api')
    app.register_blueprint(admin_products_bp, url_prefix='/api')
    app.register_blueprint(admin_dashboard_bp, url_prefix='/api')
    app.register_blueprint(admin_orders_bp, url_prefix='/api')
    app.register_blueprint(public_products_bp, url_prefix='/api')
    app.register_blueprint(customer_auth_bp, url_prefix='/api')
    app.register_blueprint(customer_orders_bp, url_prefix='/api')
