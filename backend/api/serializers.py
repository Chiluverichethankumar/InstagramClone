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
    """Basic serializer for User objects, nested in other serializers."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


# 2️⃣ UserProfile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    """Includes basic user info and all profile fields."""
    user = UserSerializer(read_only=True)
    # Read-only field to show if the user is following the profile owner (requires context['request'])
    is_following = serializers.SerializerMethodField() 

    class Meta:
        model = UserProfile
        fields = '__all__'
        
    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Checks if the requesting user is following this profile's owner (obj.user)
        return Follower.objects.filter(follower=request.user, followed=obj.user).exists()


# 3️⃣ Friend Request Serializer
class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for private follow requests, nesting User details for clarity."""
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'status', 'created_at']


# 4️⃣ Post Serializer
class PostSerializer(serializers.ModelSerializer):
    """Serializer for posts, including interaction counts."""
    user = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    
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