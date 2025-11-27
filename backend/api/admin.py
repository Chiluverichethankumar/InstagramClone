# admin.py
from django.contrib import admin
from .models import (
    UserProfile, Post, Comment, Like, Message,
    Follower, FriendRequest, Story, StoryView
)

admin.site.register(UserProfile)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(Message)
admin.site.register(Follower)
admin.site.register(FriendRequest)
admin.site.register(Story)
admin.site.register(StoryView)
