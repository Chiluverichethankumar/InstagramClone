
# backend/api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    UserProfile, Follower, FriendRequest,
    Post, Like, Comment,
    Message,
    Story, StoryView,
)

User = get_user_model()


# 1. User & Profile
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'bio', 'profile_pic', 'is_private']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']


# 2. Relationships (Follow is implicit via queries, only FriendRequest has a model)
class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']


# 3. Posts
class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'caption', 'media_urls',
            'likes_count', 'comments_count', 'created_at'
        ]


# 4. Post Interactions
class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'text', 'parent', 'replies', 'created_at']
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True}
        }

    def get_replies(self, obj):
        replies = obj.replies.all()
        return CommentSerializer(replies, many=True, context=self.context).data

# 5. Direct Messages
class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'text', 'media_url', 'is_read', 'created_at']


# 6. Stories
class StorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    media_url = serializers.URLField(read_only=True)
    media_type = serializers.CharField(read_only=True)
    expires_at = serializers.DateTimeField(read_only=True)
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
