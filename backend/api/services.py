# backend/api/services.py
from .utils import supabase
from django.utils import timezone
from .models import Story
import os

def cleanup_expired_stories():
    bucket = os.getenv("SUPABASE_BUCKET", "files")  
    expired = Story.objects.filter(expires_at__lt=timezone.now())
    for s in expired:
        path = f"stories/{s.user.id}/{s.id}"
        try:
            supabase.storage.from_(bucket).remove([path])
        except Exception as e:
            print(f"Failed to delete {path}: {e}")
    expired.delete()