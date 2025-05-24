from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Post, Notification
from sqlalchemy import desc, or_
from config import Config

users_bp = Blueprint('users', __name__)

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required(optional=True)
def get_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        
        user_dict = user.to_dict()
        
        # Add relationship info if current user is authenticated
        if current_user_id and current_user_id != user_id:
            current_user = User.query.get(current_user_id)
            user_dict['is_following'] = current_user.is_following(user)
            user_dict['is_followed_by'] = user.is_following(current_user)
        else:
            user_dict['is_following'] = False
            user_dict['is_followed_by'] = False
        
        return jsonify({'user': user_dict}), 200
    
    except Exception as e:
        return jsonify({'error': 'User tidak ditemukan'}), 404

@users_bp.route('/<username>', methods=['GET'])
@jwt_required(optional=True)
def get_user_by_username(username):
    try:
        current_user_id = get_jwt_identity()
        user = User.query.filter_by(username=username.lower()).first_or_404()
        
        user_dict = user.to_dict()
        
        # Add relationship info if current user is authenticated
        if current_user_id and current_user_id != user.id:
            current_user = User.query.get(current_user_id)
            user_dict['is_following'] = current_user.is_following(user)
            user_dict['is_followed_by'] = user.is_following(current_user)
        else:
            user_dict['is_following'] = False
            user_dict['is_followed_by'] = False
        
        return jsonify({'user': user_dict}), 200
    
    except Exception as e:
        return jsonify({'error': 'User tidak ditemukan'}), 404

@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            name = data['name'].strip()
            if len(name) < 1 or len(name) > 100:
                return jsonify({'error': 'Nama harus antara 1-100 karakter'}), 400
            user.name = name
        
        if 'bio' in data:
            bio = data['bio'].strip()
            if len(bio) > 160:
                return jsonify({'error': 'Bio tidak boleh lebih dari 160 karakter'}), 400
            user.bio = bio if bio else None
        
        if 'location' in data:
            location = data['location'].strip()
            if len(location) > 100:
                return jsonify({'error': 'Lokasi tidak boleh lebih dari 100 karakter'}), 400
            user.location = location if location else None
        
        if 'website' in data:
            website = data['website'].strip()
            if len(website) > 200:
                return jsonify({'error': 'Website tidak boleh lebih dari 200 karakter'}), 400
            user.website = website if website else None
        
        if 'avatar_url' in data:
            user.avatar_url = data['avatar_url']
        
        if 'banner_url' in data:
            user.banner_url = data['banner_url']
        
        if 'is_private' in data:
            user.is_private = bool(data['is_private'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profil berhasil diperbarui',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/<int:user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        
        if current_user_id == user_id:
            return jsonify({'error': 'Tidak dapat mengikuti diri sendiri'}), 400
        
        current_user = User.query.get_or_404(current_user_id)
        target_user = User.query.get_or_404(user_id)
        
        if current_user.is_following(target_user):
            return jsonify({'error': 'Sudah mengikuti user ini'}), 400
        
        current_user.follow(target_user)
        db.session.commit()
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            type='follow',
            message=f'{current_user.name} mengikuti Anda',
            data={'user_id': current_user_id}
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'message': f'Berhasil mengikuti {target_user.name}',
            'is_following': True
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/<int:user_id>/unfollow', methods=['POST'])
@jwt_required()
def unfollow_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        
        if current_user_id == user_id:
            return jsonify({'error': 'Tidak dapat berhenti mengikuti diri sendiri'}), 400
        
        current_user = User.query.get_or_404(current_user_id)
        target_user = User.query.get_or_404(user_id)
        
        if not current_user.is_following(target_user):
            return jsonify({'error': 'Tidak mengikuti user ini'}), 400
        
        current_user.unfollow(target_user)
        db.session.commit()
        
        return jsonify({
            'message': f'Berhenti mengikuti {target_user.name}',
            'is_following': False
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/<int:user_id>/followers', methods=['GET'])
@jwt_required(optional=True)
def get_followers(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', Config.USERS_PER_PAGE, type=int), 50)
        
        user = User.query.get_or_404(user_id)
        current_user_id = get_jwt_identity()
        
        # Check if profile is private
        if user.is_private and current_user_id != user_id:
            current_user = User.query.get(current_user_id) if current_user_id else None
            if not current_user or not current_user.is_following(user):
                return jsonify({'error': 'Profil ini bersifat privat'}), 403
        
        followers = user.followers.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        followers_data = []
        for follower in followers.items:
            follower_dict = follower.to_dict(include_stats=False)
            
            # Add relationship info if current user is authenticated
            if current_user_id and current_user_id != follower.id:
                current_user = User.query.get(current_user_id)
                follower_dict['is_following'] = current_user.is_following(follower)
                follower_dict['is_followed_by'] = follower.is_following(current_user)
            else:
                follower_dict['is_following'] = False
                follower_dict['is_followed_by'] = False
            
            followers_data.append(follower_dict)
        
        return jsonify({
            'followers': followers_data,
            'pagination': {
                'page': followers.page,
                'pages': followers.pages,
                'per_page': followers.per_page,
                'total': followers.total,
                'has_next': followers.has_next,
                'has_prev': followers.has_prev
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/<int:user_id>/following', methods=['GET'])
@jwt_required(optional=True)
def get_following(user_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', Config.USERS_PER_PAGE, type=int), 50)
        
        user = User.query.get_or_404(user_id)
        current_user_id = get_jwt_identity()
        
        # Check if profile is private
        if user.is_private and current_user_id != user_id:
            current_user = User.query.get(current_user_id) if current_user_id else None
            if not current_user or not current_user.is_following(user):
                return jsonify({'error': 'Profil ini bersifat privat'}), 403
        
        following = user.following.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        following_data = []
        for followed_user in following.items:
            followed_dict = followed_user.to_dict(include_stats=False)
            
            # Add relationship info if current user is authenticated
            if current_user_id and current_user_id != followed_user.id:
                current_user = User.query.get(current_user_id)
                followed_dict['is_following'] = current_user.is_following(followed_user)
                followed_dict['is_followed_by'] = followed_user.is_following(current_user)
            else:
                followed_dict['is_following'] = False
                followed_dict['is_followed_by'] = False
            
            following_data.append(followed_dict)
        
        return jsonify({
            'following': following_data,
            'pagination': {
                'page': following.page,
                'pages': following.pages,
                'per_page': following.per_page,
                'total': following.total,
                'has_next': following.has_next,
                'has_prev': following.has_prev
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/search', methods=['GET'])
@jwt_required(optional=True)
def search_users():
    try:
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', Config.USERS_PER_PAGE, type=int), 50)
        
        if not query:
            return jsonify({'error': 'Query pencarian wajib diisi'}), 400
        
        # Search in username, name, and bio
        users = User.query.filter(
            or_(
                User.username.contains(query.lower()),
                User.name.contains(query),
                User.bio.contains(query)
            )
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        current_user_id = get_jwt_identity()
        users_data = []
        
        for user in users.items:
            user_dict = user.to_dict(include_stats=False)
            
            # Add relationship info if current user is authenticated
            if current_user_id and current_user_id != user.id:
                current_user = User.query.get(current_user_id)
                user_dict['is_following'] = current_user.is_following(user)
                user_dict['is_followed_by'] = user.is_following(current_user)
            else:
                user_dict['is_following'] = False
                user_dict['is_followed_by'] = False
            
            users_data.append(user_dict)
        
        return jsonify({
            'users': users_data,
            'pagination': {
                'page': users.page,
                'pages': users.pages,
                'per_page': users.per_page,
                'total': users.total,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            },
            'query': query
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_user_suggestions():
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get_or_404(current_user_id)
        
        # Get users that current user is not following
        # Exclude current user and already followed users
        following_ids = [u.id for u in current_user.following]
        following_ids.append(current_user_id)
        
        # Get users with most followers (excluding already followed)
        suggested_users = User.query.filter(
            ~User.id.in_(following_ids)
        ).order_by(desc(
            db.session.query(db.func.count()).select_from(
                db.table('follows')
            ).where(
                db.table('follows').c.following_id == User.id
            ).scalar_subquery()
        )).limit(10).all()
        
        suggestions_data = []
        for user in suggested_users:
            user_dict = user.to_dict(include_stats=False)
            user_dict['is_following'] = False
            user_dict['is_followed_by'] = user.is_following(current_user)
            suggestions_data.append(user_dict)
        
        return jsonify({'suggestions': suggestions_data}), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        current_user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        
        notifications = Notification.query.filter_by(user_id=current_user_id)\
            .order_by(desc(Notification.created_at))\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        notifications_data = [notif.to_dict() for notif in notifications.items]
        
        return jsonify({
            'notifications': notifications_data,
            'pagination': {
                'page': notifications.page,
                'pages': notifications.pages,
                'per_page': notifications.per_page,
                'total': notifications.total,
                'has_next': notifications.has_next,
                'has_prev': notifications.has_prev
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@users_bp.route('/notifications/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        notification_ids = data.get('notification_ids', [])
        
        if notification_ids:
            # Mark specific notifications as read
            Notification.query.filter(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user_id
            ).update({'is_read': True}, synchronize_session=False)
        else:
            # Mark all notifications as read
            Notification.query.filter_by(
                user_id=current_user_id,
                is_read=False
            ).update({'is_read': True}, synchronize_session=False)
        
        db.session.commit()
        
        return jsonify({'message': 'Notifikasi berhasil ditandai sebagai sudah dibaca'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500