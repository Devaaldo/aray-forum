from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from config import Config
from models import db
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.users import users_bp
from routes.upload import upload_bp
import os
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize CORS with proper configuration
    CORS(app, 
         origins=["http://localhost:5173", "http://127.0.0.1:5173"],
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"])
    
    # Initialize extensions
    try:
        db.init_app(app)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        
    jwt = JWTManager(app)
    socketio = SocketIO(app, 
                       cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"])
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    
    # Create upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint tidak ditemukan'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Terjadi kesalahan server internal'}), 500
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token telah kedaluwarsa'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Token tidak valid'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Token diperlukan'}), 401
    
    # Create tables
    with app.app_context():
        try:
            # Test database connection
            db.engine.execute('SELECT 1')
            logger.info("Database connection successful")
            
            # Create tables
            db.create_all()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Database setup failed: {e}")
            # Don't crash the app, just log the error
    
    @app.route('/api/health')
    def health_check():
        try:
            # Test database connection
            db.engine.execute('SELECT 1')
            return jsonify({
                'status': 'healthy', 
                'message': 'Aray Forum API is running',
                'database': 'connected'
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'message': 'Database connection failed',
                'error': str(e)
            }), 500
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    # Development server
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)