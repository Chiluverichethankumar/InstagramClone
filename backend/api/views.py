# backend/api/views.py
import os
import uuid
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from mimetypes import guess_type
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import login, authenticate, get_user_model
from django.contrib.sessions.models import Session

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError

from .auth import SessionIDAuthentication, get_user_from_session_key
from .models import (
    UserProfile, Follower, FriendRequest,
    Post, Like, Comment, Message,
    Story, StoryView,
)
from .serializers import *
from .permissions import IsOwnerOrReadOnly
from .utils.supabase import upload_to_supabase, remove_paths, SUPABASE_BUCKET
from .services import cleanup_expired_stories

User = get_user_model()


# ===================================================================
# 1. Base ViewSet (shared logic)
# ===================================================================
class BaseModelViewSet(viewsets.ModelViewSet):
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    pagination_class = PageNumberPagination

    def perform_create(self, serializer):
        # For most models that have a 'user' FK, save the authenticated user
        serializer.save(user=self.request.user)


# ===================================================================
# 2. Authentication (Signup / Login / Logout / Me)
# ===================================================================
class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['post'])
    def signup(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("full_name", "")

        if not all([username, email, password]):
            return Response({"error": "Username, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(Q(username=username) | Q(email=email)).exists():
            return Response({"error": "User with this username or email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(username=username, email=email, password=password)
            UserProfile.objects.get_or_create(user=user, defaults={"full_name": full_name})
            login(request, user)
            request.session.save()

        return Response({
            "message": "Signup successful.",
            "session_id": request.session.session_key,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def login(self, request):
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

    # @action(detail=False, methods=['get'])
    # def me(self, request):
    #     session_key = request.headers.get("X-Session-ID")
    #     if not session_key:
    #         return Response({"error": "Session ID missing."},
    #                         status=status.HTTP_401_UNAUTHORIZED)

    #     user = get_user_from_session_key(session_key)
    #     if not user:
    #         return Response({"error": "Invalid or expired session. Please log in again."},
    #                         status=status.HTTP_401_UNAUTHORIZED)

    #     return Response({
    #         "message": "User authenticated.",
    #         "user": UserSerializer(user).data
    #     })
    @action(detail=False, methods=['get'])
    def me(self, request):
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return Response({"error": "Session ID missing."}, status=status.HTTP_401_UNAUTHORIZED)

        user = get_user_from_session_key(session_key)
        if not user:
            return Response({"error": "Invalid or expired session."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = UserProfileSerializer(user.profile, context={'request': request})
        return Response({
            "message": "User authenticated.",
            "user": serializer.data
        })

# ===================================================================
# 3. Relationships – Follow + Friend Requests (private accounts) + view any user profile
# ===================================================================
class FollowerViewSet(viewsets.ViewSet):
    """
    Handles initiating a follow (public account) or sending a follow request (private account).
    Also handles unfollow and fetching followers/following lists.
    """
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        """
        1. Sending a Follow Request / Initiating the Follow
        Handles the logic for both public (immediate follow) and private (request sent) accounts.
        """
        user_to_follow = get_object_or_404(User, id=pk)

        if user_to_follow == request.user:
            return Response({'error': 'You cannot follow yourself.'}, status=400)

        # Pre-check: If already following (e.g., if target account switched from public to private)
        if Follower.objects.filter(follower=request.user, followed=user_to_follow).exists():
             return Response({'sent': False, 'message': 'You are already following this user.'})

        profile = getattr(user_to_follow, 'profile', None)

        if profile and profile.is_private:
            # --- PRIVATE ACCOUNT LOGIC (Follow Request) ---

            # Check for existing request sent by the current user
            existing_req = FriendRequest.objects.filter(sender=request.user, receiver=user_to_follow).first()
            
            # Check for reverse pending request sent by the user_to_follow
            reverse_req = FriendRequest.objects.filter(sender=user_to_follow, receiver=request.user, status='pending').first()

            if existing_req and existing_req.status == 'pending':
                return Response({'sent': False, 'message': 'Follow request already pending.'})
            
            # If the reverse request exists, inform the user they should accept instead of sending
            if reverse_req:
                return Response({'sent': False, 'message': 'They already sent you a request. Please accept it.'})
            
            # If an old request exists (e.g., rejected or cancelled), delete it to allow re-requesting
            if existing_req:
                existing_req.delete()

            # Create the new pending follow request
            FriendRequest.objects.create(sender=request.user, receiver=user_to_follow, status='pending')
            return Response({'sent': True, 'message': 'Follow request sent (private account).'})

        else:
            # --- PUBLIC ACCOUNT LOGIC (Immediate Follow) ---
            obj, created = Follower.objects.get_or_create(follower=request.user, followed=user_to_follow)
            return Response({'message': 'Now following' if created else 'Already following'})

    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        # Delete both the Follower entry and any pending FriendRequest
        Follower.objects.filter(follower=request.user, followed_id=pk).delete()
        
        # If the user unfollows, any pending/accepted/rejected request from them to the target should also be cleaned up.
        FriendRequest.objects.filter(sender=request.user, receiver_id=pk).delete()
        
        return Response({'message': 'Unfollowed successfully.'})

    # @action(detail=True, methods=['get'])
    # def followers(self, request, pk=None):
    #     user = get_object_or_404(User, id=pk)
    #     # Assuming the Follower model uses 'following' as related name on the User model
    #     followers = User.objects.filter(following__followed=user)
    #     serializer = UserSerializer(followers, many=True)
    #     return Response(serializer.data, status=200)

    # @action(detail=True, methods=['get'])
    # def following(self, request, pk=None):
    #     user = get_object_or_404(User, id=pk)
    #     # Assuming the Follower model uses 'followers' as related name on the User model
    #     following = User.objects.filter(followers__follower=user)
    #     serializer = UserSerializer(following, many=True)
    #     return Response(serializer.data, status=200)
    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = get_object_or_404(User, id=pk)
        followers = User.objects.filter(following__followed=user)
        serializer = UserProfileSerializer([u.profile for u in followers], many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = get_object_or_404(User, id=pk)
        following = User.objects.filter(followers__follower=user)
        serializer = UserProfileSerializer([u.profile for u in following], many=True, context={'request': request})
        return Response(serializer.data)

class ProfileViewSet(viewsets.ModelViewSet):
    """
    Handles user profile viewing and updates (full_name, bio, is_private).
    Also includes a dedicated action for profile picture upload.
    """
    queryset = UserProfile.objects.select_related('user')
    serializer_class = UserProfileSerializer
    lookup_field = 'user__username'
    permission_classes = [IsAuthenticated]
    
    # Allow file uploads only for the dedicated upload_picture action, 
    # but include them here to be available for custom actions.
    parser_classes = [MultiPartParser, FormParser] 

    # -----------------------------------------------------------
    # Standard CRUD Operations (Handles text fields like bio, full_name, is_private)
    # -----------------------------------------------------------

    def get_object(self):
        """Override to always return the profile of the current user for standard updates."""
        # For standard update/partial_update (PUT/PATCH), ensure it's the requesting user's profile
        if self.action in ['update', 'partial_update']:
            return self.request.user.profile
        # For lookup by username (retrieve), use the lookup_field
        return super().get_object()
    
    def perform_update(self, serializer):
        """Custom update logic for PATCH/PUT."""
        # Prevent editing user fixed fields on the profile endpoint (optional but safe)
        if any(field in serializer.validated_data for field in ['user', 'id']):
             raise ValidationError("Core user fields cannot be modified via this endpoint.")
        
        # Ensure we don't try to save file data via the JSON endpoint
        if 'profile_pic' in serializer.validated_data:
            raise ValidationError("Use the 'upload-picture' endpoint to change the profile photo.")

        serializer.save()
        
    # -----------------------------------------------------------
    # Custom Actions
    # -----------------------------------------------------------
        
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Returns the profile of the currently authenticated user."""
        serializer = self.get_serializer(request.user.profile, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'post'], url_path='upload-picture')
    def upload_picture(self, request):
        """Dedicated endpoint to upload/change a user's profile picture."""
        profile = request.user.profile
        # Expecting 'profile_pic' field from client (matching frontend FormData key)
        file = request.FILES.get('profile_pic') 
        
        if not file:
            return Response({"error": "No profile picture file was provided. Expected field 'profile_pic'."}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Handle file type validation
        mime_type, _ = guess_type(file.name)
        if not mime_type or not mime_type.startswith('image/'):
            return Response({"error": "Only image files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Upload file to Supabase
        try:
            # Generate a unique path using user ID
            ext = os.path.splitext(file.name)[1].lower()
            # It's good practice to use a static name here like 'profile_pic' 
            # if you want to reuse the same URL and overwrite the file on update.
            path = f"profiles/{request.user.id}/profile_pic{ext}" 
            new_url = upload_to_supabase(file, path)
            
            if not new_url:
                 return Response({"error": "Supabase upload failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": f"File upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 3. Update the profile model
        # You can optionally delete the old file here if the path generation changes.
        profile.profile_pic = new_url
        profile.save(update_fields=['profile_pic'])
        
        # 4. Return updated profile data
        return Response(self.get_serializer(profile, context={'request': request}).data, status=status.HTTP_200_OK)


    @action(detail=False, methods=['patch'], url_path='privacy')
    def privacy(self, request):
        """Toggle account privacy (is_private)."""
        profile = request.user.profile
        is_private = request.data.get('is_private', None)
        
        if is_private is None:
            return Response({'error': 'is_private boolean field is required'}, status=400)
            
        profile.is_private = bool(is_private)
        profile.save()
        
        return Response({'is_private': profile.is_private}, status=status.HTTP_200_OK)

class FriendRequestViewSet(viewsets.ModelViewSet):
    """
    Manages the lifecycle of private follow requests (accept, reject, list).
    """
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only show requests where the current user is involved
        return FriendRequest.objects.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        ).select_related('sender__profile', 'receiver__profile')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        2. Accepting the Request (For Private Accounts)
        3. The "Follow Back" Mechanism (Automatic Mutual Follow)
        """
        req = self.get_object()
        
        if req.receiver != request.user:
            return Response({'error': 'You are not authorized to accept this request.'}, status=403)
        
        if req.status != 'pending':
            return Response({'error': 'Request is not pending.'}, status=400)

        # 2. Acceptance: Update request status
        req.status = 'accepted'
        req.save()

        # 3. Follow Back Mechanism (Automatic Mutual Follow)
        # This creates the *follow* relationship for the original sender (Follower -> Followed)
        Follower.objects.get_or_create(follower=req.sender, followed=req.receiver)
        
        # This creates the *follow back* relationship for the receiver (Followed -> Follower)
        Follower.objects.get_or_create(follower=req.receiver, followed=req.sender)

        return Response({'status': 'accepted', 'message': 'Request accepted, mutual follow established.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Denies a pending follow request."""
        req = self.get_object()
        if req.receiver != request.user:
            return Response({'error': 'You are not the receiver'}, status=403)
        
        if req.status != 'pending':
            return Response({'error': 'Request is not pending.'}, status=400)
            
        req.status = 'rejected'
        req.save()
        return Response({'status': 'rejected'})

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Lists pending requests where the current user is the receiver."""
        reqs = FriendRequest.objects.filter(receiver=request.user, status='pending')
        return Response(self.get_serializer(reqs, many=True).data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        """Lists pending requests where the current user is the sender."""
        reqs = FriendRequest.objects.filter(sender=request.user, status='pending')
        return Response(self.get_serializer(reqs, many=True).data)

    @action(detail=False, methods=['get'])
    def friends(self, request):
        """Lists users with an accepted (mutual) FriendRequest."""
        # Note: This is an alternate way to find mutual followers, the primary way should be via the Follower model after acceptance.
        accepted = FriendRequest.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user), status='accepted'
        )
        friends = [fr.receiver if fr.sender == request.user else fr.sender for fr in accepted]
        return Response(UserSerializer(friends, many=True).data)


# ===================================================================
# 4. Posts
# ===================================================================
class PostViewSet(BaseModelViewSet):
    queryset = Post.objects.select_related('user', 'user__profile').order_by('-created_at')
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser]  # Required for file uploads

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist('media')

        if not files:
            return Response(
                {"error": "At least one media file is required to create a post."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            post = serializer.save(user=request.user, media_urls=[])

        # 🔹 Upload files to Supabase
        for f in files:
            ext = os.path.splitext(f.name)[1].lower()
            path = f"posts/{request.user.id}/{uuid.uuid4()}{ext}"
            url = upload_to_supabase(f, path)
            if url:
                post.media_urls.append(url)

        post.save(update_fields=['media_urls'])
        return Response(self.get_serializer(post).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        paths = []

        for url in post.media_urls or []:
            try:
                path = url.split(f"/{SUPABASE_BUCKET}/")[-1]
                paths.append(path)
            except Exception:
                pass

        if paths:
            remove_paths(paths)

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def feed(self, request):
        following = Follower.objects.filter(follower=request.user).values_list('followed', flat=True)
        posts = Post.objects.filter(user_id__in=list(following) + [request.user.id]) \
                            .select_related('user', 'user__profile') \
                            .order_by('-created_at')
        page = self.paginate_queryset(posts)
        return self.get_paginated_response(self.get_serializer(page, many=True).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_posts(self, request, user_id=None):
        user = get_object_or_404(User, id=user_id)
        posts = Post.objects.filter(user=user).select_related('user', 'user__profile').order_by('-created_at')
        page = self.paginate_queryset(posts)
        return self.get_paginated_response(self.get_serializer(page, many=True).data)


# ===================================================================
# 5. Post Interactions – Likes & Comments
# ===================================================================
class LikeViewSet(viewsets.ViewSet):
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [IsAuthenticated]

    def _is_follower(self, request_user, post_user):
        return Follower.objects.filter(follower=request_user, followed=post_user).exists()

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        post = get_object_or_404(Post, id=pk)

        # Check follow permission
        if post.user != self.request.user and not Follower.objects.filter(
                follower=self.request.user, followed=post.user).exists():
            raise PermissionDenied("Only followers can comment on this post.")

        like, created = Like.objects.get_or_create(post=post, user=request.user)
        if not created:
            like.delete()
            return Response({'liked': False})
        return Response({'liked': True})

    @action(detail=True, methods=['get'])
    def list_likes(self, request, pk=None):
        post = get_object_or_404(Post, id=pk)

        # Check follow permission
        if post.user != request.user and not self._is_follower(request.user, post.user):
            raise PermissionDenied("Only followers can view likes on this post.")

        users = [like.user for like in post.likes.all()]
        return Response(UserSerializer(users, many=True).data)


class CommentViewSet(BaseModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def get_queryset(self):
        user = self.request.user
        post_id = self.request.query_params.get('post_id')

        if post_id:
            post = get_object_or_404(Post, id=post_id)

            # Only followers or owner can view comments
            if post.user != user and not Follower.objects.filter(follower=user, followed=post.user).exists():
                raise PermissionDenied("Only followers can view comments on this post.")

            # Return top-level comments
            return Comment.objects.filter(post_id=post_id, parent=None)

        # Return comments by current user
        return Comment.objects.filter(user=user)

    def perform_create(self, serializer):
        post = serializer.validated_data.get('post')
        parent = serializer.validated_data.get('parent')  # get parent comment if provided

        if post is None:
            raise ValidationError({"post": "This field is required."})

        # Only followers or owner can comment
        if post.user != self.request.user and not Follower.objects.filter(
                follower=self.request.user, followed=post.user).exists():
            raise PermissionDenied("Only followers can comment on this post.")

        # If parent is provided, check if parent comment exists and belongs to same post
        if parent:
            if parent.post != post:
                raise ValidationError({"parent": "Parent comment must belong to the same post."})

        serializer.save(user=self.request.user)



# ===================================================================
# 6. Direct Messages
# ===================================================================
class MessageViewSet(BaseModelViewSet):
    authentication_classes = [SessionIDAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        other_id = self.kwargs.get("user_id")

        if other_id:
            return Message.objects.filter(
                Q(sender=user, receiver_id=other_id) |
                Q(receiver=user, sender_id=other_id)
            ).order_by('created_at')

        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        # validate receiver exists
        receiver_id = self.request.data.get('receiver')
        if not receiver_id:
            raise ValidationError({"receiver": "Receiver id is required."})
        receiver = get_object_or_404(User, id=receiver_id)

        # Optional: restrict messaging to followers (uncomment if you want this)
        # if not Follower.objects.filter(follower=self.request.user, followed=receiver).exists():
        #     raise PermissionDenied("You can only send messages to people you follow.")

        file = self.request.FILES.get('media')
        media_url = None

        if file:
            try:
                ext = os.path.splitext(file.name)[1].lower()
                path = f"messages/{self.request.user.id}/{uuid.uuid4()}{ext}"
                media_url = upload_to_supabase(file, path)
            except Exception as e:
                # return friendly JSON error instead of 500
                raise ValidationError({"media": f"File upload failed: {str(e)}"})

        serializer.save(
            sender=self.request.user,
            receiver=receiver,
            media_url=media_url
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Marks a specific message as read.
        Only the receiver of the message is allowed to perform this action.
        """
        msg = get_object_or_404(Message, id=pk)

        if msg.receiver != request.user:
            return Response({'error': 'Only the recipient can mark this message as read.'},
                            status=status.HTTP_403_FORBIDDEN)

        if not msg.is_read:
            msg.is_read = True
            msg.read_at = timezone.now()
            msg.save(update_fields=['is_read', 'read_at'])

        return Response({'message': 'Message marked as read.'}, status=status.HTTP_200_OK)


    @action(detail=False, methods=['get'], url_path='chat/(?P<user_id>[^/.]+)')
    def chat(self, request, user_id=None):
        other = get_object_or_404(User, id=user_id)
        msgs = Message.objects.filter(
            Q(sender=request.user, receiver=other) |
            Q(sender=other, receiver=request.user)
        ).order_by('created_at')
        return Response(self.get_serializer(msgs, many=True).data)


# ===================================================================
# 7. Stories
# ===================================================================

class StoryViewSet(BaseModelViewSet):
    queryset = Story.objects.filter(expires_at__gt=timezone.now()).select_related('user')
    serializer_class = StorySerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        file = self.request.FILES.get('file') or self.request.FILES.get('media')
        if not file:
            raise ValidationError({"media": "This field is required."})

        # Detect file type
        mime_type, _ = guess_type(file.name)
        if not mime_type or not mime_type.startswith(('image/', 'video/')):
            raise ValidationError({"media": "Only image or video files are allowed."})

        media_type = 'image' if mime_type.startswith('image/') else 'video'

        # Upload file
        try:
            path = f"stories/{self.request.user.id}/{uuid.uuid4()}{os.path.splitext(file.name)[1]}"
            media_url = upload_to_supabase(file, path)
        except Exception as e:
            raise ValidationError({"media": f"Story upload failed: {str(e)}"})

        # Set expiration 24 hours from now
        expires_at = timezone.now() + timedelta(hours=24)

        serializer.save(user=self.request.user, media_url=media_url, media_type=media_type, expires_at=expires_at)

    @action(detail=False, methods=['get'])
    def list_active(self, request):
        following = Follower.objects.filter(follower=request.user).values_list('followed', flat=True)
        user_ids = list(following) + [request.user.id]
        stories = Story.objects.filter(user__in=user_ids, expires_at__gt=timezone.now()) \
                               .order_by('user', '-created_at')
        return Response(self.get_serializer(stories, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        story = get_object_or_404(Story, id=pk)

        # 🔹 Cannot view your own story as 'viewer'
        if story.user == request.user:
            return Response({'message': 'You cannot mark your own story as viewed.'}, status=400)

        # 🔹 If already viewed, don't duplicate
        view, created = StoryView.objects.get_or_create(
            story=story,
            viewer=request.user
        )

        return Response({
            'viewed': True,
            'is_new_view': created,
            'story_id': pk,
            'total_views': StoryView.objects.filter(story=story).count()
        })


    @action(detail=True, methods=['get'])
    def views(self, request, pk=None):
        story = get_object_or_404(Story, id=pk)
        viewers = StoryView.objects.filter(story=story).values_list('viewer', flat=True)
        users = User.objects.filter(id__in=viewers)
        return Response(UserSerializer(users, many=True).data)


    @action(detail=False, methods=['post'])
    def cleanup(self, request):
        cleanup_expired_stories()
        return Response({'cleaned': True})

    @action(detail=True, methods=['delete'])
    def delete_story(self, request, pk=None):
        story = get_object_or_404(Story, id=pk)
        if story.user != request.user:
            return Response({'error': 'Not allowed'}, status=403)
        story.delete()
        return Response({'deleted': True})


# ===================================================================
# 8. User Search
# ===================================================================
class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if len(q) < 2:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=q) | Q(profile__full_name__icontains=q)
        ).distinct()[:20]

