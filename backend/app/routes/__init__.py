"""
Blueprint registration — all route blueprints are imported and registered here.
"""


def register_routes(app):
    """Register all API blueprints with the Flask app."""
    from .health import health_bp

    app.register_blueprint(health_bp, url_prefix='/api')
