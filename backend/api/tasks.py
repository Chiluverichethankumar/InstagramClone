# api/tasks.py
from celery import shared_task
from .utils.supabase import upload_to_supabase # Your existing sync function
from .models import Post, Story # Or whatever model needs the URL

@shared_task
def process_upload_and_save_model(file_data, path, model_id, model_type):
    """Uploads file to Supabase and updates the model instance."""
    try:
        # Note: Celery runs in a separate process, so blocking is fine here.
        media_url = upload_to_supabase(file_data, path)

        if model_type == 'Post':
            model = Post.objects.get(id=model_id)
            model.media_urls.append(media_url)
            model.save()
        # ... handle other models (Story, etc.)

        return {"status": "completed", "url": media_url}
    except Exception as e:
        # Handle failure, potentially logging the error
        return {"status": "failed", "error": str(e)}
@shared_task
def cleanup_expired_stories():
    Story.objects.filter(expires_at__lt=timezone.now()).delete()