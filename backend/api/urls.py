from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, PostViewSet, CommentViewSet, LikeViewSet,
    MessageViewSet, FollowerViewSet, FriendRequestViewSet,
    StoryViewSet, UserSearchView,
)
from django.http import JsonResponse
from django.utils import timezone

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'stories', StoryViewSet)
router.register(r'friend-requests', FriendRequestViewSet)
router.register(r'likes', LikeViewSet, basename='like')
router.register(r'followers', FollowerViewSet, basename='follower')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'messages', MessageViewSet, basename='messages')

def health_check(request):
    return JsonResponse({'status': 'ok', 'time': timezone.now().isoformat()})

urlpatterns = [
    path('health/', health_check, name='health'),
    path('search/users/', UserSearchView.as_view(), name='user-search'),
    path('', include(router.urls)),
]