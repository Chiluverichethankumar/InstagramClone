from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.db import models
from .models import UserProfile
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import * # Assuming all models are imported here (e.g., Post, Comment, etc.)
from .serializers import * # Assuming all serializers are imported here
from .utils.supabase import upload_to_supabase, supabase, remove_paths, SUPABASE_BUCKET
from .services import cleanup_expired_stories
from .permissions import IsOwnerOrReadOnly
from .auth import SessionIDAuthentication, get_user_from_session_key
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import os
import uuid

User = get_user_model()

# ==========================================================
# 1. BASE VIEWSET (MUST BE DEFINED FIRST)
# ==========================================================
class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset for models with authentication and permissions.
    """
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

# ==========================================================
# 2. AUTH VIEWSET (Corrected)
# ==========================================================

# ... (imports and @method_decorator remain the same) ...

class AuthViewSet(viewsets.ViewSet):
    # ... (permission_classes, etc., remain the same) ...
    
    @action(detail=False, methods=['post'], 
            permission_classes=[AllowAny], 
            authentication_classes=[]) 
    def signup(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name", "")

        if not all([username, email, password]):
            return Response({"error": "Username, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Check if username or email already exists to prevent duplicate creation
        if User.objects.filter(Q(username=username) | Q(email=email)).exists():
            return Response({"error": "User with this username or email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 2. Create User and Profile
            user = User.objects.create_user(username=username, email=email, password=password)
            UserProfile.objects.get_or_create(user=user, defaults={"full_name": full_name})
            
            # 3. Log the new user in and force session save
            login(request, user)  # Success!
            request.session.save() # 🔑 FIX: Force save session key immediately

        return Response({
            "message": "Signup successful.",
            "session_id": request.session.session_key,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'],
            permission_classes=[AllowAny],
            authentication_classes=[]) 
    def login(self, request):
        # ... (Your existing login code is correct after adding request.session.save()) ...
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        request.session.save() # ✅ CORRECT: This is the fix you need here
        
        return Response({
            "message": "Login successful.",
            "session_id": request.session.session_key,
            "user": UserSerializer(user).data
        })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def logout(self, request):
        # ... (Your existing logout code) ...
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return Response({"error": "Session ID missing in request headers."},
                            status=status.HTTP_401_UNAUTHORIZED)
        try:
            Session.objects.get(session_key=session_key).delete()
            return Response({"message": "Logout successful."})
        except Session.DoesNotExist:
            return Response({"error": "Invalid session ID."},
                            status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny]) 
    def me(self, request):
        # ... (Your existing me code) ...
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return Response({"error": "Session ID missing."}, status=status.HTTP_401_UNAUTHORIZED)

        from .auth import get_user_from_session_key
        user = get_user_from_session_key(session_key)
        if not user:
            return Response({"error": "Invalid or expired session. Please log in again."},
                            status=status.HTTP_401_UNAUTHORIZED)

        return Response({
            "message": "User authenticated.",
            "user": UserSerializer(user).data
        })


# ==========================================================
# 3. POSTS (Now PostViewSet works because BaseModelViewSet is defined)
# ==========================================================
class PostViewSet(BaseModelViewSet):
    """
    Viewset for handling posts (create, list, retrieve, update, delete).
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def get_queryset(self):
        """
        1. Returns all posts ordered by creation date (newest first).
        2. Uses select_related for user and profile to solve N+1 query problem.
        """
        # Improved efficiency: Prefetch related data for user and their profile
        return Post.objects.select_related('user', 'user__profile').all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Refactored for non-blocking operations:
        1. Creates a placeholder Post object immediately.
        2. Dispatches file upload to a Celery worker in the background.
        3. Returns 202 ACCEPTED instantly, ensuring high concurrency.
        """
        print(f"[CREATE] User: {request.user}, Auth: {request.user.is_authenticated}")
        files = request.FILES.getlist('media')
        
        # 1. Validate Post data (media fields should be optional in serializer now)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 2. Create the Post object with no media URLs yet
        with transaction.atomic():
            # NOTE: If your Post model has an 'upload_status' field, set it to 'pending'
            post = serializer.save(user=request.user, media_urls=[]) 
        
        # 3. Dispatch file uploads to Celery (Non-Blocking)
        if files:
            for f in files:
                # Read the file content and other details *before* the request closes
                file_content = f.read()
                file_name = f.name
                content_type = f.content_type
                
                # --- CONCEPTUAL CELERY DISPATCH ---
                # NOTE: You must implement upload_post_media_async in your tasks.py
                # upload_post_media_async.delay(
                #     post_id=post.id, 
                #     file_content=file_content, 
                #     file_name=file_name, 
                #     content_type=content_type
                # )
                # ----------------------------------
                
                # *** Temporary Sync Fallback (REMOVE THIS IN PRODUCTION!) ***
                # This section is for local testing if Celery is not running. 
                # It brings back the blocking issue.
                
                f.seek(0)
                ext = os.path.splitext(f.name)[1].lower() if f.name else ""
                path = f"posts/{request.user.id}/{uuid.uuid4()}{ext}"
                url = upload_to_supabase(f, path)
                if url:
                    post.media_urls.append(url)
                    post.save(update_fields=['media_urls'])
                # *** End Temporary Sync Fallback ***
        
        # 4. Return the response immediately
        # Use 202 Accepted to signal that processing is ongoing
        return Response(self.get_serializer(post).data, status=status.HTTP_201_CREATED if not files else status.HTTP_202_ACCEPTED)


    def destroy(self, request, *args, **kwargs):
        """
        Deletes the post and attempts to remove associated files from Supabase.
        The file removal should also ideally be in a background task for resiliency.
        """
        post = self.get_object()
        paths_to_remove = []

        for url in post.media_urls or []:
            try:
                # A more robust and simpler path extraction for Supabase public URL structure
                base_path = f'/storage/v1/object/public/{SUPABASE_BUCKET}/'
                if base_path in url:
                    # Extracts everything after the bucket name
                    path = url.split(base_path)[-1]
                else:
                    # Fallback or handling of signed URLs: Find SUPABASE_BUCKET and take everything after it
                    parts = url.split('/')
                    if SUPABASE_BUCKET in parts:
                        idx = parts.index(SUPABASE_BUCKET)
                        path = "/".join(parts[idx + 1:])
                    else:
                        raise ValueError("Could not reliably parse Supabase path from URL.")
                
                paths_to_remove.append(path)
            except Exception as e:
                print(f"Failed to parse URL {url}: {e}")

        # ⚠️ NOTE: This file removal call is synchronous and blocking.
        # For high-traffic apps, this should also be delegated to a Celery task.
        try:
            remove_paths(paths_to_remove)
        except Exception as e:
            # Important: Log the failure but allow the Post deletion to proceed
            print(f"Cleanup failed (non-critical, post deletion continuing): {e}")

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def feed(self, request):
        """
        Step-by-step:
        1. Get users the current user is following.
        2. Fetch posts from those users, ordered by creation date.
        3. Paginate and serialize the results.
        """
        following = Follower.objects.filter(follower=request.user).values_list('followed', flat=True)
        # Include current user's own posts in the feed (optional, but common)
        user_ids = list(following) + [request.user.id] 
        
        posts = Post.objects.filter(user__in=user_ids).select_related('user', 'user__profile').order_by('-created_at')
        
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_posts(self, request, user_id=None):
        """
        Step-by-step:
        1. Get the specified user.
        2. Fetch their posts, ordered by creation date.
        3. Paginate and serialize the results.
        """
        user = get_object_or_404(User, id=user_id)
        posts = Post.objects.filter(user=user).select_related('user', 'user__profile').order_by('-created_at')
        
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
# COMMENTS
class CommentViewSet(BaseModelViewSet):
    # ... (Rest of your CommentViewSet code) ...
    """
    Viewset for handling comments.
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def get_queryset(self):
        """
        Step-by-step:
        1. If post_id query param is provided, return top-level comments for that post with replies.
        2. Otherwise, return empty queryset.
        """
        post_id = self.request.query_params.get('post_id')
        if post_id:
            return Comment.objects.filter(post_id=post_id, parent=None).prefetch_related('replies')
        return Comment.objects.none()

    def perform_create(self, serializer):
        """
        Step-by-step:
        1. Save the comment with the current user.
        """
        serializer.save(user=self.request.user)

# LIKES
class LikeViewSet(viewsets.ViewSet):
    # ... (Rest of your LikeViewSet code) ...
    """
    Viewset for handling likes (toggle and list).
    """
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """
        Step-by-step:
        1. Get the post.
        2. Create or delete like for the current user.
        3. Return liked status.
        """
        post = get_object_or_404(Post, id=pk)
        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False})
        return Response({'liked': True})

    @action(detail=True, methods=['get'])
    def list_likes(self, request, pk=None):
        """
        Step-by-step:
        1. Get the post.
        2. Fetch all likes and their users.
        3. Serialize and return user data.
        """
        post = get_object_or_404(Post, id=pk)
        likes = Like.objects.filter(post=post)
        users = [l.user for l in likes]
        return Response(UserSerializer(users, many=True).data)

# MESSAGES
class MessageViewSet(BaseModelViewSet):
    # ... (Rest of your MessageViewSet code) ...
    """
    Viewset for handling messages.
    """
    serializer_class = MessageSerializer

    def get_queryset(self):
        """
        Step-by-step:
        1. Handle different cases based on URL:
            - For single message or mark_read: Filter by sender/receiver.
            - For chat with user: Filter messages between users.
        2. Return ordered queryset or empty.
        """
        user = self.request.user
        user_id = self.kwargs.get("user_id")
        # --- Case 1: /api/messages/<uuid>/ OR /api/messages/<uuid>/mark_read/ ---
        if self.kwargs.get("pk"):
            return Message.objects.filter(
                Q(sender=user) |
                Q(receiver=user)
            )
        # --- Case 2: /api/messages/chat/<user_id>/ ---
        if user_id:
            return Message.objects.filter(
                Q(sender=user, receiver_id=user_id) |
                Q(receiver=user, sender_id=user_id)
            ).order_by("created_at")
        # Default empty
        return Message.objects.none()

    # CREATE MESSAGE
    def perform_create(self, serializer):
        """
        Step-by-step:
        1. Get receiver ID and validate.
        2. Get receiver user.
        3. Upload media if provided.
        4. Save message with sender, receiver, and media URL.
        """
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            from rest_framework import serializers as s
            raise s.ValidationError({'receiver': 'Required'})
        receiver = get_object_or_404(User, id=receiver_id)
        # Upload media if provided
        file = self.request.FILES.get('media')
        media_url = None
        if file:
            path = f"messages/{self.request.user.id}/{uuid.uuid4()}"
            media_url = upload_to_supabase(file, path)
        serializer.save(
            sender=self.request.user,
            receiver=receiver,
            media_url=media_url
        )

    # MARK AS READ
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Step-by-step:
        1. Get the message.
        2. Check if current user is receiver.
        3. Mark as read and save.
        """
        msg = get_object_or_404(Message, id=pk)
        # Only receiver can mark read
        if msg.receiver != request.user:
            return Response({'error': 'Not receiver'}, status=403)
        msg.is_read = True
        msg.save()
        return Response({'read': True})

    # CHAT WITH USER
    @action(detail=False, methods=['get'], url_path='chat/(?P<user_id>[^/.]+)')
    def chat(self, request, user_id=None):
        """
        Step-by-step:
        1. Get the other user.
        2. Fetch messages between users, ordered by creation.
        3. Serialize and return.
        """
        other_user = get_object_or_404(User, id=user_id)
        msgs = Message.objects.filter(
            Q(sender=request.user, receiver=other_user) |
            Q(sender=other_user, receiver=request.user)
        ).order_by('created_at')
        return Response(self.get_serializer(msgs, many=True).data)

# FOLLOW/UNFOLLOW
class FollowerViewSet(viewsets.ViewSet):
    # ... (Rest of your FollowerViewSet code) ...
    """
    Viewset for handling follows, unfollows, followers, and following lists.
    """
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """
        Step-by-step:
        1. Get the user to follow.
        2. Prevent self-follow.
        3. Create follow relationship.
        """
        user = get_object_or_404(User, id=pk)
        if user == request.user:
            return Response({'error': 'Cannot follow self'}, status=400)
        Follower.objects.get_or_create(follower=request.user, followed=user)
        return Response({'following': True})

    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        """
        Step-by-step:
        1. Delete follow relationship.
        """
        Follower.objects.filter(follower=request.user, followed_id=pk).delete()
        return Response({'following': False})

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """
        Step-by-step:
        1. Get the user.
        2. Fetch their followers.
        3. Paginate (if available) and serialize.
        """
        user = get_object_or_404(User, id=pk)
        followers = User.objects.filter(following__followed=user)
        page = self.paginate_queryset(followers) if hasattr(self, 'paginate_queryset') else followers
        serializer = UserSerializer(page, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """
        Step-by-step:
        1. Get the user.
        2. Fetch users they are following.
        3. Paginate (if available) and serialize.
        """
        user = get_object_or_404(User, id=pk)
        following = User.objects.filter(followers__follower=user)
        page = self.paginate_queryset(following) if hasattr(self, 'paginate_queryset') else following
        serializer = UserSerializer(page, many=True)
        return Response(serializer.data)

# FRIEND REQUESTS
class FriendRequestViewSet(BaseModelViewSet):
    # ... (Rest of your FriendRequestViewSet code) ...
    """
    Viewset for handling friend requests (send, accept, reject, list).
    """
    queryset = FriendRequest.objects.all()
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def send(self, request):
        """
        Step-by-step:
        1. Get receiver user.
        2. Create or get pending request.
        """
        receiver = get_object_or_404(User, id=request.data.get('receiver'))
        req, created = FriendRequest.objects.get_or_create(
            sender=request.user, receiver=receiver, defaults={'status': 'pending'}
        )
        return Response({'sent': created})

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Step-by-step:
        1. Get the request.
        2. Check if current user is receiver.
        3. Update status to accepted.
        """
        req = self.get_object()
        if req.receiver != request.user:
            return Response({'error': 'You are not the receiver'}, status=403)
        req.status = 'accepted'
        req.save()
        return Response({'status': 'accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Step-by-step:
        1. Get the request.
        2. Check if current user is receiver.
        3. Update status to rejected.
        """
        req = self.get_object()
        if req.receiver != request.user:
            return Response({'error': 'You are not the receiver'}, status=403)
        req.status = 'rejected'
        req.save()
        return Response({'status': 'rejected'})

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Step-by-step:
        1. Fetch pending requests for current user.
        2. Serialize and return.
        """
        reqs = FriendRequest.objects.filter(receiver=request.user, status='pending')
        serializer = self.get_serializer(reqs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def friends(self, request):
        """
        Step-by-step:
        1. Fetch accepted friend requests involving current user.
        2. Collect unique friends.
        3. Serialize and return.
        """
        user = request.user
        accepted = FriendRequest.objects.filter(
            (Q(sender=user) | Q(receiver=user)),
            status='accepted'
        )
        friends = set()
        for fr in accepted:
            if fr.sender == user:
                friends.add(fr.receiver)
            else:
                friends.add(fr.sender)
        # Convert set to list
        friends = list(friends)
        return Response(UserSerializer(friends, many=True).data)

# STORIES
class StoryViewSet(BaseModelViewSet):
    # ... (Rest of your StoryViewSet code) ...
    """
    Viewset for handling stories (create, list active, mark viewed, etc.).
    """
    queryset = Story.objects.filter(expires_at__gt=timezone.now())
    serializer_class = StorySerializer
    parser_classes = [MultiPartParser, FormParser]  # ← ADD THIS

    def perform_create(self, serializer):
        """
        Step-by-step:
        1. Get media file and validate.
        2. Upload to Supabase.
        3. Determine media type (image/video).
        4. Save story with user, URL, and type.
        """
        file = self.request.FILES.get('media')
        if not file:
            raise ValidationError({"media": "No file uploaded"})
        path = f"stories/{self.request.user.id}/{uuid.uuid4()}"
        url = upload_to_supabase(file, path)
        media_type = 'image' if file.content_type.startswith('image') else 'video'
        serializer.save(
            user=self.request.user,
            media_url=url,
            media_type=media_type
        )

    @action(detail=False, methods=['get'])
    def list_active(self, request):
        """
        Step-by-step:
        1. Get following users including self.
        2. Fetch active stories from those users.
        3. Serialize and return.
        """
        following = Follower.objects.filter(follower=request.user).values_list('followed', flat=True)
        user_ids = list(following) + [request.user.id]
        stories = Story.objects.filter(
            user__in=user_ids,
            expires_at__gt=timezone.now()
        ).order_by('user', '-created_at')
        serializer = self.get_serializer(stories, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        """
        Step-by-step:
        1. Get the story.
        2. Create view record for current user.
        """
        story = get_object_or_404(Story, id=pk)
        StoryView.objects.get_or_create(story=story, viewer=request.user)
        return Response({'viewed': True})

    @action(detail=True, methods=['get'])
    def viewers(self, request, pk=None):
        """
        Step-by-step:
        1. Get the story.
        2. Check if current user is owner.
        3. Fetch viewers and serialize.
        """
        story = get_object_or_404(Story, id=pk)
        if story.user != request.user:
            return Response({'error': 'Not owner'}, status=403)
        views = StoryView.objects.filter(story=story)
        users = [v.viewer for v in views]
        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        """
        Step-by-step:
        1. Call service to clean expired stories.
        """
        cleanup_expired_stories()
        return Response({'cleaned': True})

    @action(detail=True, methods=['delete'])
    def delete_story(self, request, pk=None):
        """
        Step-by-step:
        1. Get the story.
        2. Check if current user is owner.
        3. Delete the story.
        """
        story = get_object_or_404(Story, id=pk)
        if story.user != request.user:
            return Response({'error': 'Not allowed'}, status=403)
        story.delete()
        return Response({'deleted': True})

# USER SEARCH
class UserSearchView(generics.ListAPIView):
    # ... (Rest of your UserSearchView code) ...
    """
    API view for searching users by username or full name.
    """
    serializer_class = UserSerializer

    def get_queryset(self):
        """
        Step-by-step:
        1. Get search query 'q'.
        2. If query is too short, return empty.
        3. Filter users by username or profile full_name (case-insensitive).
        4. Return up to 20 distinct results.
        """
        q = self.request.query_params.get('q', '')
        if len(q) < 2:
            return User.objects.none()
        return User.objects.filter(
            models.Q(username__icontains=q) | models.Q(profile__full_name__icontains=q)
        ).distinct()[:20]