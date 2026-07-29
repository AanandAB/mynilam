from django.db import models
from django.conf import settings
import uuid


class BaseModelManager(models.Manager):

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False, is_active=True)


# Create your models here.
class CommonModel(models.Model):
    row_guid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )
    updated_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='+'
    )

    objects = BaseModelManager()
    
    class Meta:
        abstract = True

