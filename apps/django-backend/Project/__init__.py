# Register the Celery app when the `Project` package is imported, so `shared_task`
# decorators (e.g. in `communications/tasks.py`) and `-A Project` worker invocations
# all resolve to the same app instance. This is the standard Celery + Django hook.
from .celery import app as celery_app

__all__ = ('celery_app',)
