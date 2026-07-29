import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Project.settings")
django.setup()

from accounts.models import UserRole

for ur in UserRole.objects.all():
    print(f"User: {ur.user.email}, Role: {ur.role.name}")
