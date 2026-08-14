"""
Extension singletons — instantiated here, initialized in the app factory.

This pattern avoids circular imports when models or routes need
to reference db, jwt, etc.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
