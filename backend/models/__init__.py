from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Association table for user follows
follows = db.Table('follows',
    db.Column('follower_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('following_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

# Association table for post likes
post_likes = db.Table('post_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('post_id', db.Integer, db.ForeignKey('posts.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text)
    location = db.Column(db.String(100))
    website = db.Column(db.String(200))
    avatar_url = db.Column(db.String(255))
    banner_url = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    is_private = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    posts = db.relationship('Post', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    liked_posts = db.relationship('Post', secondary=post_likes, backref='liked_by', lazy='dynamic')
    
    # Following relationships
    following = db.relationship(
        'User', secondary=follows,
        primaryjoin=(follows.c.follower_id == id),
        secondaryjoin=(follows.c.following_id == id),
        backref=db.backref('followers', lazy='dynamic'),
        lazy='dynamic'
    )
    
    def to_dict(self, include_stats=True):
        data = {
            'id': self.id,
            'username': self.username,
            'name': self.name,
            'bio': self.bio,
            'location': self.location,
            'website': self.website,
            'avatar_url': self.avatar_url,
            'banner_url': self.banner_url,
            'is_verified': self.is_verified,
            'is_private': self.is_private,
            'created_at': self.created_at.isoformat()
        }
        
        if include_stats:
            data.update({
                'posts_count': self.posts.count(),
                'followers_count': self.followers.count(),
                'following_count': self.following.count()
            })
        
        return data
    
    def follow(self, user):
        if not self.is_following(user):
            self.following.append(user)
    
    def unfollow(self, user):
        if self.is_following(user):
            self.following.remove(user)
    
    def is_following(self, user):
        return self.following.filter(follows.c.following_id == user.id).count() > 0

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('posts.id'))  # For replies/quotes
    media_url = db.Column(db.String(255))
    media_type = db.Column(db.String(20))  # 'image' or 'video'
    is_repost = db.Column(db.Boolean, default=False)
    original_post_id = db.Column(db.Integer, db.ForeignKey('posts.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    reposts = db.relationship('Post', backref='original_post', remote_side=[id])
    replies = db.relationship('Post', backref='parent_post', remote_side=[id])
    
    def to_dict(self, include_author=True, include_stats=True):
        data = {
            'id': self.id,
            'content': self.content,
            'media_url': self.media_url,
            'media_type': self.media_type,
            'is_repost': self.is_repost,
            'original_post_id': self.original_post_id,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_author:
            data['author'] = self.author.to_dict(include_stats=False)
        
        if include_stats:
            data.update({
                'likes_count': self.liked_by.count(),
                'comments_count': self.comments.count(),
                'reposts_count': Post.query.filter_by(original_post_id=self.id).count()
            })
        
        return data

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))  # For nested comments
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship for nested comments
    replies = db.relationship('Comment', backref='parent_comment', remote_side=[id])
    
    def to_dict(self, include_author=True):
        data = {
            'id': self.id,
            'content': self.content,
            'post_id': self.post_id,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_author:
            data['author'] = self.author.to_dict(include_stats=False)
        
        return data

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'like', 'comment', 'follow', 'mention'
    message = db.Column(db.String(255), nullable=False)
    data = db.Column(db.JSON)  # Additional data (post_id, user_id, etc.)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'message': self.message,
            'data': self.data,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }