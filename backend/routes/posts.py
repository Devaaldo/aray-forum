from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Post, User, Comment, Notification
from sqlalchemy import desc, and_, or_
from config import Config

posts_bp = Blueprint('posts', __name__)

@posts_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_posts():
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', Config.POSTS_PER_PAGE, type=int), 100)
        feed_type = request.args.get('type', 'explore')  # 'timeline', 'explore', 'user'
        user_id = request.args.get('user_id', type=int)
        
        current_user_id = get_jwt_identity()
        
        # Base query
        query = Post.query.filter_by(parent_id=None)  # Only top-level posts, not replies
        
        if feed_type == 'timeline' and current_user_id:
            # Get posts from followed users
            current_user = User.query.get(current_user_id)
            following_ids = [u.id for u in current_user.following]
            following_ids.append(current_user_id)  # Include own posts
            query = query.filter(Post.user_id.in_(following_ids))
        
        elif feed_type == 'user' and user_id:
            # Get posts from specific user
            query = query.filter_by(user_id=user_id)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Post.created_at))
        
        # Paginate
        posts = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Convert to dict and add user interaction info
        posts_data = []
        for post in posts.items:
            post_dict = post.to_dict()
            
            if current_user_id:
                # Check if current user liked this post
                post_dict['is_liked'] = post.liked_by.filter_by(id=current_user_id).first() is not None
                # Check if current user reposted this post
                post_dict['is_reposted'] = Post.query.filter_by(
                    user_id=current_user_id, 
                    original_post_id=post.id,
                    is_repost=True
                ).first() is not None
            else:
                post_dict['is_liked'] = False
                post_dict['is_reposted'] = False
            
            posts_data.append(post_dict)
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': posts.page,
                'pages': posts.pages,
                'per_page': posts.per_page,
                'total': posts.total,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('', methods=['POST'])
@jwt_required()
def create_post():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        content = data.get('content', '').strip()
        parent_id = data.get('parent_id')  # For replies
        media_url = data.get('media_url')
        media_type = data.get('media_type')
        
        if not content and not media_url:
            return jsonify({'error': 'Konten atau media wajib diisi'}), 400
        
        if len(content) > 280:
            return jsonify({'error': 'Konten tidak boleh lebih dari 280 karakter'}), 400
        
        # Create new post
        post = Post(
            content=content,
            user_id=current_user_id,
            parent_id=parent_id,
            media_url=media_url,
            media_type=media_type
        )
        
        db.session.add(post)
        db.session.commit()
        
        # Create notification if this is a reply
        if parent_id:
            parent_post = Post.query.get(parent_id)
            if parent_post and parent_post.user_id != current_user_id:
                notification = Notification(
                    user_id=parent_post.user_id,
                    type='comment',
                    message=f'{post.author.name} membalas postingan Anda',
                    data={'post_id': post.id, 'parent_post_id': parent_id}
                )
                db.session.add(notification)
                db.session.commit()
        
        return jsonify({
            'message': 'Post berhasil dibuat',
            'post': post.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>', methods=['GET'])
@jwt_required(optional=True)
def get_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        
        post_dict = post.to_dict()
        
        if current_user_id:
            post_dict['is_liked'] = post.liked_by.filter_by(id=current_user_id).first() is not None
            post_dict['is_reposted'] = Post.query.filter_by(
                user_id=current_user_id, 
                original_post_id=post.id,
                is_repost=True
            ).first() is not None
        else:
            post_dict['is_liked'] = False
            post_dict['is_reposted'] = False
        
        return jsonify({'post': post_dict}), 200
    
    except Exception as e:
        return jsonify({'error': 'Post tidak ditemukan'}), 404

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        
        # Check if user owns the post
        if post.user_id != current_user_id:
            return jsonify({'error': 'Anda tidak memiliki izin untuk menghapus post ini'}), 403
        
        db.session.delete(post)
        db.session.commit()
        
        return jsonify({'message': 'Post berhasil dihapus'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        user = User.query.get(current_user_id)
        
        # Check if already liked
        if post.liked_by.filter_by(id=current_user_id).first():
            return jsonify({'error': 'Post sudah dilike'}), 400
        
        # Add like
        post.liked_by.append(user)
        db.session.commit()
        
        # Create notification
        if post.user_id != current_user_id:
            notification = Notification(
                user_id=post.user_id,
                type='like',
                message=f'{user.name} menyukai postingan Anda',
                data={'post_id': post.id, 'user_id': current_user_id}
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Post berhasil dilike',
            'likes_count': post.liked_by.count()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/unlike', methods=['POST'])
@jwt_required()
def unlike_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        user = User.query.get(current_user_id)
        
        # Check if liked
        if not post.liked_by.filter_by(id=current_user_id).first():
            return jsonify({'error': 'Post belum dilike'}), 400
        
        # Remove like
        post.liked_by.remove(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Like berhasil dihapus',
            'likes_count': post.liked_by.count()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/repost', methods=['POST'])
@jwt_required()
def repost(post_id):
    try:
        current_user_id = get_jwt_identity()
        original_post = Post.query.get_or_404(post_id)
        user = User.query.get(current_user_id)
        
        # Check if already reposted
        existing_repost = Post.query.filter_by(
            user_id=current_user_id,
            original_post_id=post_id,
            is_repost=True
        ).first()
        
        if existing_repost:
            return jsonify({'error': 'Post sudah direpost'}), 400
        
        # Create repost
        repost = Post(
            content='',  # Reposts don't have content
            user_id=current_user_id,
            original_post_id=post_id,
            is_repost=True
        )
        
        db.session.add(repost)
        db.session.commit()
        
        # Create notification
        if original_post.user_id != current_user_id:
            notification = Notification(
                user_id=original_post.user_id,
                type='repost',
                message=f'{user.name} merepost postingan Anda',
                data={'post_id': repost.id, 'original_post_id': post_id}
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Post berhasil direpost',
            'repost': repost.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/unrepost', methods=['POST'])
@jwt_required()
def unrepost(post_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Find the repost
        repost = Post.query.filter_by(
            user_id=current_user_id,
            original_post_id=post_id,
            is_repost=True
        ).first()
        
        if not repost:
            return jsonify({'error': 'Repost tidak ditemukan'}), 404
        
        db.session.delete(repost)
        db.session.commit()
        
        return jsonify({'message': 'Repost berhasil dihapus'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/comments', methods=['GET'])
@jwt_required(optional=True)
def get_comments(post_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        post = Post.query.get_or_404(post_id)
        
        comments = Comment.query.filter_by(post_id=post_id, parent_id=None)\
            .order_by(desc(Comment.created_at))\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        comments_data = [comment.to_dict() for comment in comments.items]
        
        return jsonify({
            'comments': comments_data,
            'pagination': {
                'page': comments.page,
                'pages': comments.pages,
                'per_page': comments.per_page,
                'total': comments.total,
                'has_next': comments.has_next,
                'has_prev': comments.has_prev
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    try:
        current_user_id = get_jwt_identity()
        post = Post.query.get_or_404(post_id)
        
        data = request.get_json()
        content = data.get('content', '').strip()
        parent_id = data.get('parent_id')  # For nested comments
        
        if not content:
            return jsonify({'error': 'Konten komentar wajib diisi'}), 400
        
        if len(content) > 280:
            return jsonify({'error': 'Komentar tidak boleh lebih dari 280 karakter'}), 400
        
        comment = Comment(
            content=content,
            user_id=current_user_id,
            post_id=post_id,
            parent_id=parent_id
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # Create notification
        if post.user_id != current_user_id:
            user = User.query.get(current_user_id)
            notification = Notification(
                user_id=post.user_id,
                type='comment',
                message=f'{user.name} mengomentari postingan Anda',
                data={'post_id': post_id, 'comment_id': comment.id}
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Komentar berhasil ditambahkan',
            'comment': comment.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Terjadi kesalahan server'}), 500

@posts_bp.route('/search', methods=['GET'])
@jwt_required(optional=True)
def search_posts():
    try:
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', Config.POSTS_PER_PAGE, type=int), 100)
        
        if not query:
            return jsonify({'error': 'Query pencarian wajib diisi'}), 400
        
        # Search in post content
        posts = Post.query.filter(
            Post.content.contains(query)
        ).order_by(desc(Post.created_at))\
         .paginate(page=page, per_page=per_page, error_out=False)
        
        current_user_id = get_jwt_identity()
        posts_data = []
        
        for post in posts.items:
            post_dict = post.to_dict()
            if current_user_id:
                post_dict['is_liked'] = post.liked_by.filter_by(id=current_user_id).first() is not None
                post_dict['is_reposted'] = Post.query.filter_by(
                    user_id=current_user_id, 
                    original_post_id=post.id,
                    is_repost=True
                ).first() is not None
            else:
                post_dict['is_liked'] = False
                post_dict['is_reposted'] = False
            
            posts_data.append(post_dict)
        
        return jsonify({
            'posts': posts_data,
            'pagination': {
                'page': posts.page,
                'pages': posts.pages,
                'per_page': posts.per_page,
                'total': posts.total,
                'has_next': posts.has_next,
                'has_prev': posts.has_prev
            },
            'query': query
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan server'}), 500