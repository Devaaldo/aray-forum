from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import re
import logging

# Setup logging
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    if len(password) < 8:
        return False, "Password harus minimal 8 karakter"
    if not re.search(r'[A-Z]', password):
        return False, "Password harus mengandung huruf besar"
    if not re.search(r'[a-z]', password):
        return False, "Password harus mengandung huruf kecil"
    if not re.search(r'\d', password):
        return False, "Password harus mengandung angka"
    return True, "Valid"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        # Log incoming request
        logger.info("Registration attempt received")
        
        data = request.get_json()
        if not data:
            logger.warning("No JSON data received in registration")
            return jsonify({'error': 'Data JSON diperlukan'}), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'username', 'password']
        for field in required_fields:
            if not data.get(field):
                logger.warning(f"Missing field in registration: {field}")
                return jsonify({'error': f'{field} wajib diisi'}), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        username = data['username'].strip().lower()
        password = data['password']
        
        logger.info(f"Registration attempt for email: {email}, username: {username}")
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Format email tidak valid'}), 400
        
        # Validate username (alphanumeric and underscore only)
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({'error': 'Username hanya boleh mengandung huruf, angka, dan underscore'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            logger.info(f"Registration failed: Email {email} already exists")
            return jsonify({'error': 'Email sudah terdaftar'}), 409
        
        existing_username = User.query.filter_by(username=username).first()
        if existing_username:
            logger.info(f"Registration failed: Username {username} already exists")
            return jsonify({'error': 'Username sudah digunakan'}), 409
        
        # Create new user
        password_hash = generate_password_hash(password)
        user = User(
            name=name,
            email=email,
            username=username,
            password_hash=password_hash
        )
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"User registered successfully: {email}")
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Registrasi berhasil',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        logger.info("Login attempt received")
        
        data = request.get_json()
        if not data:
            logger.warning("No JSON data received in login")
            return jsonify({'error': 'Data JSON diperlukan'}), 400
        
        email_or_username = data.get('email_or_username', '').strip().lower()
        password = data.get('password', '')
        
        if not email_or_username or not password:
            return jsonify({'error': 'Email/username dan password wajib diisi'}), 400
        
        logger.info(f"Login attempt for: {email_or_username}")
        
        # Find user by email or username
        user = User.query.filter(
            (User.email == email_or_username) | 
            (User.username == email_or_username)
        ).first()
        
        if not user:
            logger.info(f"Login failed: User not found for {email_or_username}")
            return jsonify({'error': 'Email/username atau password salah'}), 401
        
        if not check_password_hash(user.password_hash, password):
            logger.info(f"Login failed: Wrong password for {email_or_username}")
            return jsonify({'error': 'Email/username atau password salah'}), 401
        
        logger.info(f"Login successful for user: {user.email}")
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Login berhasil',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
        
        access_token = create_access_token(identity=current_user_id)
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In a production app, you might want to blacklist the token
    # For now, we'll just return success (client should remove token)
    return jsonify({'message': 'Logout berhasil'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User tidak ditemukan'}), 404
        
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Password lama dan baru wajib diisi'}), 400
        
        # Verify current password
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': 'Password lama salah'}), 401
        
        # Validate new password
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Update password
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password berhasil diubah'}), 200
    
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500