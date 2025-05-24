from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image
import os
import uuid
from config import Config

upload_bp = Blueprint('upload', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def generate_filename(original_filename):
    """Generate unique filename while preserving extension"""
    ext = original_filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"

def optimize_image(image_path, max_width=1200, max_height=1200, quality=85):
    """Optimize image size and quality"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save optimized image
            img.save(image_path, optimize=True, quality=quality)
            
        return True
    except Exception as e:
        print(f"Error optimizing image: {e}")
        return False

@upload_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    try:
        current_user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Format file tidak didukung'}), 400
        
        # Check file size (16MB max)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > Config.MAX_CONTENT_LENGTH:
            return jsonify({'error': 'Ukuran file terlalu besar (maksimal 16MB)'}), 400
        
        # Generate unique filename
        filename = generate_filename(file.filename)
        
        # Create user-specific directory
        user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(current_user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, filename)
        
        # Save file
        file.save(file_path)
        
        # Optimize image if it's an image file
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext in ['jpg', 'jpeg', 'png']:
            optimize_image(file_path)
        
        # Return URL path
        file_url = f"/api/upload/files/{current_user_id}/{filename}"
        
        return jsonify({
            'message': 'File berhasil diupload',
            'file_url': file_url,
            'filename': filename,
            'file_size': os.path.getsize(file_path)
        }), 201
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan saat mengupload file'}), 500

@upload_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    try:
        current_user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        # Only allow image files for avatar
        allowed_avatar_extensions = {'png', 'jpg', 'jpeg'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_avatar_extensions):
            return jsonify({'error': 'Format avatar harus PNG, JPG, atau JPEG'}), 400
        
        # Check file size (5MB max for avatar)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return jsonify({'error': 'Ukuran avatar terlalu besar (maksimal 5MB)'}), 400
        
        # Generate unique filename
        filename = f"avatar_{generate_filename(file.filename)}"
        
        # Create user-specific directory
        user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(current_user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, filename)
        
        # Save and optimize image
        file.save(file_path)
        
        # Optimize avatar (smaller size for avatars)
        optimize_image(file_path, max_width=400, max_height=400, quality=90)
        
        # Update user avatar URL
        from models import db, User
        user = User.query.get(current_user_id)
        user.avatar_url = f"/api/upload/files/{current_user_id}/{filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar berhasil diupload',
            'avatar_url': user.avatar_url,
            'filename': filename
        }), 200
    
    except Exception as e:
        from models import db
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan saat mengupload avatar'}), 500

@upload_bp.route('/banner', methods=['POST'])
@jwt_required()
def upload_banner():
    try:
        current_user_id = get_jwt_identity()
        
        if 'file' not in request.files:
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
        
        # Only allow image files for banner
        allowed_banner_extensions = {'png', 'jpg', 'jpeg'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_banner_extensions):
            return jsonify({'error': 'Format banner harus PNG, JPG, atau JPEG'}), 400
        
        # Check file size (10MB max for banner)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            return jsonify({'error': 'Ukuran banner terlalu besar (maksimal 10MB)'}), 400
        
        # Generate unique filename
        filename = f"banner_{generate_filename(file.filename)}"
        
        # Create user-specific directory
        user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(current_user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        file_path = os.path.join(user_upload_dir, filename)
        
        # Save and optimize image
        file.save(file_path)
        
        # Optimize banner (wider aspect ratio)
        optimize_image(file_path, max_width=1500, max_height=500, quality=85)
        
        # Update user banner URL
        from models import db, User
        user = User.query.get(current_user_id)
        user.banner_url = f"/api/upload/files/{current_user_id}/{filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Banner berhasil diupload',
            'banner_url': user.banner_url,
            'filename': filename
        }), 200
    
    except Exception as e:
        from models import db
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan saat mengupload banner'}), 500

@upload_bp.route('/files/<int:user_id>/<filename>')
def get_uploaded_file(user_id, filename):
    """Serve uploaded files"""
    try:
        user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(user_id))
        return send_from_directory(user_upload_dir, filename)
    except Exception as e:
        return jsonify({'error': 'File tidak ditemukan'}), 404

@upload_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_file():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        filename = data.get('filename')
        if not filename:
            return jsonify({'error': 'Nama file wajib diisi'}), 400
        
        # Security: Only allow deletion of files in user's directory
        file_path = os.path.join(Config.UPLOAD_FOLDER, str(current_user_id), filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File tidak ditemukan'}), 404
        
        # Delete file
        os.remove(file_path)
        
        return jsonify({'message': 'File berhasil dihapus'}), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan saat menghapus file'}), 500

@upload_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_unused_files():
    """Clean up unused files (optional feature for storage management)"""
    try:
        current_user_id = get_jwt_identity()
        user_upload_dir = os.path.join(Config.UPLOAD_FOLDER, str(current_user_id))
        
        if not os.path.exists(user_upload_dir):
            return jsonify({'message': 'Tidak ada file untuk dibersihkan'}), 200
        
        from models import Post, User
        
        # Get all file URLs used by this user
        user = User.query.get(current_user_id)
        used_files = set()
        
        # Add avatar and banner
        if user.avatar_url:
            used_files.add(os.path.basename(user.avatar_url))
        if user.banner_url:
            used_files.add(os.path.basename(user.banner_url))
        
        # Add media from posts
        posts = Post.query.filter_by(user_id=current_user_id).all()
        for post in posts:
            if post.media_url:
                used_files.add(os.path.basename(post.media_url))
        
        # Find unused files
        all_files = set(os.listdir(user_upload_dir))
        unused_files = all_files - used_files
        
        # Delete unused files
        deleted_count = 0
        for filename in unused_files:
            file_path = os.path.join(user_upload_dir, filename)
            try:
                os.remove(file_path)
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting {filename}: {e}")
        
        return jsonify({
            'message': f'{deleted_count} file tidak terpakai berhasil dihapus',
            'deleted_count': deleted_count
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan saat membersihkan file'}), 500