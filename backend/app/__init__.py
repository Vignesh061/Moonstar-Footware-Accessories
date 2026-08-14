"""
Application Factory — creates and configures the Flask application.

Uses the Application Factory pattern for modularity and testability.
"""
import os
from flask import Flask
from .config import config_map
from .extensions import db, migrate, jwt, cors


def create_app(config_name=None):
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map['development']))

    # Initialize extensions
    _init_extensions(app)

    # Register blueprints
    _register_blueprints(app)

    return app


def _init_extensions(app):
    """Initialize Flask extensions."""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', '*'),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })


def _register_blueprints(app):
    """Register all Flask blueprints."""
    from .routes import register_routes
    register_routes(app)
