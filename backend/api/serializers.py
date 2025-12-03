# serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    UserProfile, Follower, FriendRequest,
    Post, Like, Comment,
    Message,
    Story, StoryView,
)

User = get_user_model()

# 1️⃣ User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'email']  # FIXED fields cannot be changed via API
# 2️⃣ UserProfile Serializer (FIXED: Added count methods + is_requested)
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_following = serializers.SerializerMethodField()
    
    # 🌟 ADD THIS FIELD:
    is_requested = serializers.SerializerMethodField()
    
    # 🌟 ADDED: Fields to calculate and display the counts
    posts_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        # 🌟 UPDATED: Include is_requested + count fields
        fields = [
            'id', 'user', 'full_name', 'bio', 'profile_pic', 'is_private', 
            'is_following', 'is_requested',  # ← ADD is_requested HERE
            'posts_count', 'followers_count', 'following_count' 
        ]
        read_only_fields = [
            'id', 'is_following', 'is_requested',  # ← ADD is_requested HERE
            'posts_count', 'followers_count', 'following_count'
        ]

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Follower.objects.filter(follower=request.user, followed=obj.user).exists()

    # 🌟 ADD THIS METHOD - CHECKS FOR PENDING FRIEND REQUEST:
    def get_is_requested(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return FriendRequest.objects.filter(
            sender=request.user, 
            receiver=obj.user, 
            status='pending'
        ).exists()

    # 🌟 NEW METHOD: Get number of posts for this user
    def get_posts_count(self, obj):
        return Post.objects.filter(user=obj.user).count()

    # 🌟 NEW METHOD: Get number of users following this user
    def get_followers_count(self, obj):
        return Follower.objects.filter(followed=obj.user).count()

    # 🌟 NEW METHOD: Get number of users this user is following
    def get_following_count(self, obj):
        return Follower.objects.filter(follower=obj.user).count()

    
# 3️⃣ Friend Request Serializer
# serializers.py - FriendRequestSerializer
class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    # 🌟 ADD THIS: Writable receiver field
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True,
        source='receiver'
    )

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'status', 'created_at']


# 4️⃣ Post Serializer
class PostSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(source='user.profile', read_only=True)  # <-- Updated
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    has_liked = serializers.SerializerMethodField()

    # Check if the requesting user has liked this post
    has_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'caption', 'media_urls',
            'likes_count', 'comments_count', 'has_liked', 'created_at'
        ]

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Like.objects.filter(post=obj, user=request.user).exists()


# 5️⃣ Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments, including recursive replies."""
    user = UserSerializer(read_only=True)
    # Replies are recursively serialized
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'text', 'parent', 'replies', 'created_at']
        extra_kwargs = {
            # Parent is optional for top-level comments
            'parent': {'required': False, 'allow_null': True} 
        }

    def get_replies(self, obj):
        # Prevent infinite recursion by only returning non-null replies
        replies = obj.replies.all() 
        # Pass context for nested serializers
        return CommentSerializer(replies, many=True, context=self.context).data


# 6️⃣ Message Serializer
class MessageSerializer(serializers.ModelSerializer):
    """Serializer for direct messages."""
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'text', 'media_url', 'is_read', 'created_at']


# 7️⃣ Story Serializer
class StorySerializer(serializers.ModelSerializer):
    """Serializer for ephemeral stories, tracking viewer status."""
    user = UserSerializer(read_only=True)
    # Checks if the requesting user has viewed this story
    is_viewed = serializers.SerializerMethodField() 

    class Meta:
        model = Story
        fields = [
            'id', 'user', 'media_url', 'media_type',
            'created_at', 'expires_at', 'is_viewed'
        ]

    def get_is_viewed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return StoryView.objects.filter(story=obj, viewer=request.user).exists()

