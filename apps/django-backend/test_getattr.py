import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from properties.models import Property
p = Property.objects.first()
print("Hasattr:", hasattr(p, 'hostel_config'))
try:
    print("Getattr:", getattr(p, 'hostel_config', None))
except Exception as e:
    print("Error:", type(e), str(e))
