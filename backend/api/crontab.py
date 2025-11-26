from django_cron import CronJobBase, Schedule
from .models import Story
from django.utils import timezone

class DeleteExpiredStories(CronJobBase):
    RUN_EVERY_MINS = 60 * 24  # daily

    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'app.delete_expired_stories'

    def do(self):
        Story.objects.filter(expires_at__lt=timezone.now()).delete()
