import logging
import os
from app import app, db
from models import User

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database and create default admin user."""
    try:
        with app.app_context():
            db.create_all()
            logger.info("Database tables created successfully")
            
            # Create default admin user
            if User.create_default_admin(db):
                logger.info("Admin user created successfully")
            else:
                logger.info("Admin user already exists")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        # Initialize database before starting the server
        init_database()
        
        # Use port 5000 for Replit environment
        port = int(os.environ.get("PORT", 5000))
        logger.info(f"Starting Flask application on port {port}...")
        app.run(
            host='0.0.0.0',  # Bind to all interfaces
            port=port,
            debug=True
        )
    except Exception as e:
        logger.error(f"Error starting Flask application: {str(e)}")
        raise  # Re-raise the exception to ensure proper error handling
