"""
Configuration classes for different environments.

Loads sensitive values from environment variables via python-dotenv.
"""
import os
from dotenv import load_dotenv

# Load .env file from the backend directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


class BaseConfig:
    """Base configuration shared across all environments."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-secret')

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    JWT_TOKEN_LOCATION = ['headers']

    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
    SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET', 'product-images')

    # OTP
    OTP_DEV_MODE = os.getenv('OTP_DEV_MODE', 'true').lower() == 'true'
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '5'))

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True  # Log all SQL queries


class ProductionConfig(BaseConfig):
    """Production environment configuration."""
    DEBUG = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        'pool_size': 10,
        'max_overflow': 20,
    }


class TestingConfig(BaseConfig):
    """Testing environment configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Map environment names to config classes
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
