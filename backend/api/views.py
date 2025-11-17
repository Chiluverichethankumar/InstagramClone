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
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import *  # Assuming all models are imported here (e.g., Post, Comment, etc.)
from .serializers import *  # Assuming all serializers are imported here
from .utils.supabase import upload_to_supabase, supabase, remove_paths, SUPABASE_BUCKET
from .services import cleanup_expired_stories
from .permissions import IsOwnerOrReadOnly
from .auth import SessionIDAuthentication, get_user_from_session_key
from django.db.models import Q
import os
import uuid

User = get_user_model()

class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base viewset for models with authentication and permissions.
    """
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class AuthViewSet(viewsets.ViewSet):
    """
    Handles user registration, login, logout, and user info.
    Session-based authentication using X-Session-ID.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['post'])
    def signup(self, request):
        """
        Step-by-step:
        1. Get input data (username, email, password, full_name).
        2. Validate required fields.
        3. Check if username exists:
           - If exists and password matches, log in the user.
           - If exists but password doesn't match, return error.
        4. If new user, create user and profile, then log in.
        5. Return session ID and user data.
        """
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name", "")
        # Validate input
        if not username or not email or not password:
            return Response(
                {"error": "Username, email, and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # If username exists → LOGIN instead of error
        try:
            user = User.objects.get(username=username)
            # Check password
            if not user.check_password(password):
                return Response(
                    {"error": "Account already exists. Incorrect password."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Existing user → Direct login
            login(request, user)
            request.session.save()
            return Response({
                "message": "User already existed. Logged in successfully.",
                "session_id": request.session.session_key,
                "user": UserSerializer(user).data
            })
        except User.DoesNotExist:
            # New signup → create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            # Create profile safely
            UserProfile.objects.get_or_create(user=user, defaults={"full_name": full_name})
            # Login new user
            login(request, user)
            request.session.save()
            return Response({
                "message": "Signup successful.",
                "session_id": request.session.session_key,
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """
        Step-by-step:
        1. Get username and password.
        2. Validate required fields.
        3. Authenticate user.
        4. If valid, log in and return session ID and user data.
        """
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response({"error": "Username and password are required."},
                            status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"error": "Invalid username or password."},
                            status=status.HTTP_400_BAD_REQUEST)
        login(request, user)
        request.session.save()
        return Response({
            "message": "Login successful.",
            "session_id": request.session.session_key,
            "user": UserSerializer(user).data
        })

    @action(detail=False, methods=['post'])
    def logout(self, request):
        """
        Step-by-step:
        1. Get session key from headers.
        2. Validate session key.
        3. Delete session if valid.
        """
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return Response({"error": "Session ID missing in request headers."},
                            status=status.HTTP_401_UNAUTHORIZED)
        try:
            session = Session.objects.get(session_key=session_key)
            session.delete()
            return Response({"message": "Logout successful."})
        except Session.DoesNotExist:
            return Response({"error": "Invalid or expired session ID."},
                            status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Step-by-step:
        1. Get session key from headers.
        2. Validate and get user from session.
        3. Return user data if authenticated.
        """
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return Response({"error": "Session ID missing."}, status=status.HTTP_401_UNAUTHORIZED)
        user = get_user_from_session_key(session_key)
        if not user:
            return Response({"error": "Invalid or expired session. Please log in again."},
                            status=status.HTTP_401_UNAUTHORIZED)
        return Response({"message": "User authenticated.", "user": UserSerializer(user).data})

# POSTS
class PostViewSet(BaseModelViewSet):
    """
    Viewset for handling posts (create, list, retrieve, update, delete).
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def get_queryset(self):
        """
        Step-by-step:
        1. Return all posts ordered by creation date (newest first).
        """
        return Post.objects.select_related('user').all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        Step-by-step:
        1. Get media files from request.
        2. Upload each file to Supabase and collect URLs.
        3. If upload fails, clean up previous uploads and return error.
        4. Validate and save post with user and media URLs in a transaction.
        """
        print(f"[CREATE] User: {request.user}, Auth: {request.user.is_authenticated}")
        files = request.FILES.getlist('media')
        uploaded_paths = []
        media_urls = []
        if files:
            for f in files:
                f.seek(0)
                ext = os.path.splitext(f.name)[1].lower() if f.name else ""
                path = f"posts/{request.user.id}/{uuid.uuid4()}{ext}"
                print(f"[DJANGO] Uploading: {f.name} → {path}")
                url = upload_to_supabase(f, path)  # ← FROM supabase.py
                if not url:
                    print(f"[FAIL] Upload failed for {path} → cleaning up")
                    try:
                        remove_paths(uploaded_paths)
                    except:
                        pass
                    return Response({"error": "Failed to upload media"}, status=500)
                media_urls.append(url)
                uploaded_paths.append(path)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            post = serializer.save(user=request.user, media_urls=media_urls)
        return Response(self.get_serializer(post).data, status=201)

    def destroy(self, request, *args, **kwargs):
        """
        Step-by-step:
        1. Get the post object.
        2. Parse media URLs to extract paths for deletion.
        3. Remove files from Supabase.
        4. Delete the post.
        """
        post = self.get_object()
        paths_to_remove = []
        for url in post.media_urls or []:
            try:
                if "/storage/v1/object/public/" in url:
                    path = url.split('/storage/v1/object/public/')[-1]
                    bucket_name = path.split('/')[0]
                    path = '/'.join(path.split('/')[1:])  # Remove bucket from path
                else:
                    parts = url.split('/')
                    if SUPABASE_BUCKET in parts:
                        idx = parts.index(SUPABASE_BUCKET)
                        path = "/".join(parts[idx+1:])
                    else:
                        path = "/".join(parts[-3:])
                paths_to_remove.append(path)
            except Exception as e:
                print(f"Failed to parse URL {url}: {e}")
        try:
            remove_paths(paths_to_remove)
        except Exception as e:
            print(f"Cleanup failed: {e}")
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
        posts = Post.objects.filter(user__in=following).order_by('-created_at')
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
        posts = Post.objects.filter(user=user).order_by('-created_at')
        page = self.paginate_queryset(posts)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

# COMMENTS
class CommentViewSet(BaseModelViewSet):
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