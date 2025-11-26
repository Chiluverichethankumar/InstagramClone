from celery.schedules import crontab

app.conf.beat_schedule = {
    'cleanup-expired-stories-daily': {
        'task': 'yourapp.tasks.cleanup_expired_stories',
        'schedule': crontab(hour=0, minute=0),  # Runs at Midnight daily
    },
}
