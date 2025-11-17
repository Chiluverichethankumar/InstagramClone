# backend/api/auth.py
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.sessions.models import Session
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def get_user_from_session_key(session_key: str):
    """
    Return User instance for a valid session_key, or None.
    Safely deletes expired sessions.
    """
    if not session_key:
        return None
    try:
        session = Session.objects.get(session_key=session_key)
        if session.expire_date and session.expire_date < timezone.now():
            # expired
            session.delete()
            return None
        data = session.get_decoded()
        user_id = data.get('_auth_user_id')
        if not user_id:
            return None
        return User.objects.get(id=user_id)
    except (Session.DoesNotExist, User.DoesNotExist):
        return None

class SessionIDAuthentication(BaseAuthentication):
    """
    Authenticates with header X-Session-ID -> Django session key.
    Returns (user, None) or raises AuthenticationFailed.
    If header missing, return None to let other authenticators run.
    """
    def authenticate(self, request):
        session_key = request.headers.get("X-Session-ID")
        if not session_key:
            return None
        user = get_user_from_session_key(session_key)
        if not user:
            raise AuthenticationFailed("Invalid or expired session. Please log in again.")
        return (user, None)
