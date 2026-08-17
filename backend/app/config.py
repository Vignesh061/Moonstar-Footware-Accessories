"""
Configuration classes for different environments.
Loads sensitive values from environment variables via python-dotenv.
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


class BaseConfig:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fallback-jwt-secret')
    # Default 7 days — long enough that tokens don't expire during normal use.
    # Override in .env with JWT_ACCESS_TOKEN_EXPIRES=<seconds>
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '604800'))
    JWT_TOKEN_LOCATION = ['headers']

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
    SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET', 'product-images')

    # Google OAuth (Customer login)
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

    # OTP
    OTP_DEV_MODE = os.getenv('OTP_DEV_MODE', 'true').lower() == 'true'
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', '5'))

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_ECHO = os.getenv('SQLALCHEMY_ECHO', 'false').lower() == 'true'


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        'pool_size': 10,
        'max_overflow': 20,
    }


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
