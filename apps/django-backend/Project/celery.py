"""
Celery configuration for the Project.

Celery handles background work (async notifications, scheduled reminders, email)
so the request/response cycle stays fast. The broker is Redis (see settings.py
`CELERY_BROKER_URL`); in local dev `CELERY_TASK_ALWAYS_EAGER` runs tasks inline
so no broker/worker process is needed.

Run a worker with:
    .venv/Scripts/python.exe -m celery -A Project worker -l info
(requires Redis running, or set CELERY_TASK_ALWAYS_EAGER=false to force a worker.)
"""
import os

from celery import Celery

# Point Celery at Django's settings before the app boots (same module the WSGI/
# ASGI servers use). `setdefault` keeps any caller-supplied value.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Project.settings')

app = Celery('Project')

# Load Celery config from Django's settings using the CELERY_* namespace.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover `tasks.py` modules in every installed app (e.g. communications.tasks).
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """Sanity-check task — confirms the worker is wired up end to end."""
    print(f'Request: {self.request!r}')
