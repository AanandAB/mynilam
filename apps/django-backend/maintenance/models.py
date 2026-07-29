from django.db import models
from django.conf import settings
from core.models import CommonModel


class MaintenanceCategory(CommonModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class MaintenanceRequest(CommonModel):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Urgent', 'Urgent')
    ]
    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('Acknowledged', 'Acknowledged'),
        ('InProgress', 'InProgress'),
        ('OnHold', 'OnHold'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled')
    ]
    
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='maintenance_requests')
    lease = models.ForeignKey('leases.LeaseContract', on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_requests')
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reported_maintenance_requests')
    category = models.ForeignKey(MaintenanceCategory, on_delete=models.RESTRICT, related_name='requests')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Submitted')
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_maintenance_requests'
    )
    scheduled_date = models.DateField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(null=True, blank=True)
    
    estimated_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    currency_code = models.CharField(max_length=3, null=True, blank=True)

    def __str__(self):
        return f"Req {self.id}: {self.title}"


class MaintenanceRequestMedia(CommonModel):
    MEDIA_TYPE_CHOICES = [
        ('Image', 'Image'),
        ('Video', 'Video')
    ]
    request = models.ForeignKey(MaintenanceRequest, on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    media_url = models.URLField(max_length=1000)
    caption = models.CharField(max_length=300, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.media_type} for Req {self.request.id}"
