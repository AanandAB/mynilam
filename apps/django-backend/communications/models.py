from django.db import models
from django.conf import settings
from core.models import CommonModel
from django.core.validators import MinValueValidator, MaxValueValidator


class Conversation(CommonModel):
    TYPE_CHOICES = [
        ('General', 'General'),
        ('LeaseInquiry', 'LeaseInquiry'),
        ('MaintenanceUpdate', 'MaintenanceUpdate'),
        ('PaymentReminder', 'PaymentReminder'),
        ('Notification', 'Notification')
    ]
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    lease = models.ForeignKey('leases.LeaseContract', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    maintenance_request = models.ForeignKey('maintenance.MaintenanceRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    subject = models.CharField(max_length=200, null=True, blank=True)
    conversation_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='General')
    last_message_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Conv {self.id}: {self.subject or 'No Subject'}"


class ConversationParticipant(CommonModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.email} in Conv {self.conversation.id}"


class Message(CommonModel):
    TYPE_CHOICES = [
        ('Text', 'Text'),
        ('Image', 'Image'),
        ('File', 'File'),
        ('SystemNotification', 'SystemNotification')
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    body = models.TextField()
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Text')
    attachment_url = models.URLField(max_length=1000, null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Msg {self.id} in Conv {self.conversation.id}"


class Notification(CommonModel):
    TYPE_CHOICES = [
        ('NewMessage', 'NewMessage'),
        ('PaymentDue', 'PaymentDue'),
        ('PaymentReceived', 'PaymentReceived'),
        ('MaintenanceUpdate', 'MaintenanceUpdate'),
        ('LeaseExpiry', 'LeaseExpiry'),
        ('ApplicationUpdate', 'ApplicationUpdate'),
        ('SystemAlert', 'SystemAlert')
    ]
    CHANNEL_CHOICES = [
        ('InApp', 'InApp'),
        ('Email', 'Email'),
        ('Push', 'Push'),
        ('SMS', 'SMS')
    ]
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=1000)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    reference_id = models.BigIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    delivery_channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='InApp')
    is_delivered = models.BooleanField(default=False)

    def __str__(self):
        return f"Notif for {self.recipient.email}: {self.title}"


class Review(CommonModel):
    REVIEWEE_CHOICES = [
        ('Property', 'Property'),
        ('Landlord', 'Landlord'),
        ('Tenant', 'Tenant')
    ]
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Published', 'Published'),
        ('Flagged', 'Flagged'),
        ('Removed', 'Removed')
    ]
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee_type = models.CharField(max_length=20, choices=REVIEWEE_CHOICES)
    reviewee_id = models.BigIntegerField()
    lease = models.ForeignKey('leases.LeaseContract', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    
    overall_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    cleanliness = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    communication = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value_for_money = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    location = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    
    title = models.CharField(max_length=200, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    moderation_notes = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"Review by {self.reviewer.email} on {self.reviewee_type} {self.reviewee_id}"


class Favorite(CommonModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'property')

    def __str__(self):
        return f"{self.user.email} fav {self.property.id}"


class SavedSearch(CommonModel):
    FREQ_CHOICES = [
        ('Instant', 'Instant'),
        ('Daily', 'Daily'),
        ('Weekly', 'Weekly')
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_searches')
    name = models.CharField(max_length=100)
    search_criteria = models.JSONField()
    alert_enabled = models.BooleanField(default=False)
    alert_frequency = models.CharField(max_length=20, choices=FREQ_CHOICES, null=True, blank=True)
    last_alert_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Saved Search {self.name} for {self.user.email}"


class Inquiry(CommonModel):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Responded', 'Responded'),
        ('Accepted', 'Accepted'),
        ('Closed', 'Closed'),
    ]
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='inquiries')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_inquiries')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_inquiries')
    message = models.TextField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    inquiry_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    class Meta:
        indexes = [
            models.Index(fields=['recipient', 'inquiry_status']),
        ]

