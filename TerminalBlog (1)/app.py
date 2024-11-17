import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from sqlalchemy.orm import DeclarativeBase
from flask_cors import CORS

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

app = Flask(__name__, 
           static_folder='static',
           static_url_path='')

# Configure CORS properly
CORS(app, resources={r"/*": {"origins": "*"}})

# Set up configuration
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY", "a-very-secret-key")

# Handle potential sslmode in DATABASE_URL
database_url = os.environ.get("DATABASE_URL")
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["DEBUG"] = True

# Initialize extensions
db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

# Create tables and admin user before importing routes
with app.app_context():
    import models
    try:
        db.create_all()
        app.logger.info("Database tables created successfully")
        
        # Create default admin user
        from models import User
        if User.create_default_admin(db):
            app.logger.info("Admin user created successfully")
        else:
            app.logger.info("Admin user already exists")
            
    except Exception as e:
        app.logger.error(f"Error creating database tables: {str(e)}")

    # Import routes after database and admin setup
    import routes
