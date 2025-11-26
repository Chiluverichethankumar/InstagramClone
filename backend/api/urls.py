

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse
from django.utils import timezone

from .views import (
    AuthViewSet, PostViewSet, CommentViewSet, LikeViewSet,
    MessageViewSet, FollowerViewSet, FriendRequestViewSet,
    StoryViewSet, UserSearchView,ProfileViewSet
)

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='posts')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'stories', StoryViewSet, basename='stories')
router.register(r'friend-requests', FriendRequestViewSet, basename='friend-requests')
router.register(r'likes', LikeViewSet, basename='likes')
router.register(r'followers', FollowerViewSet, basename='followers')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'messages', MessageViewSet, basename='messages')
router.register(r'profiles', ProfileViewSet, basename='profile')


def health_check(request):
    return JsonResponse({'status': 'ok', 'time': timezone.now().isoformat()})

urlpatterns = [
    path('health/', health_check, name='health'),
    path('search/users/', UserSearchView.as_view(), name='user-search'),
    path('', include(router.urls)),
]
