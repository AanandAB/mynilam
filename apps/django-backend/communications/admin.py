from django.contrib import admin
from .models import (
    Conversation, ConversationParticipant, Message, 
    Notification, Review, Favorite, SavedSearch
)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'conversation_type', 'last_message_at', 'is_active')
    list_filter = ('conversation_type',)
    raw_id_fields = ('property', 'lease', 'maintenance_request')

@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'user', 'is_muted', 'is_active')
    raw_id_fields = ('conversation', 'user')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'message_type', 'is_edited')
    list_filter = ('message_type',)
    raw_id_fields = ('conversation', 'sender')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'notification_type', 'title', 'is_read', 'is_delivered')
    list_filter = ('notification_type', 'is_read', 'is_delivered', 'delivery_channel')
    raw_id_fields = ('recipient',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'reviewer', 'reviewee_type', 'reviewee_id', 'overall_rating', 'status')
    list_filter = ('reviewee_type', 'status', 'overall_rating')
    raw_id_fields = ('reviewer', 'lease')

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'property', 'is_active')
    raw_id_fields = ('user', 'property')

@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'alert_enabled', 'alert_frequency')
    list_filter = ('alert_enabled', 'alert_frequency')
    raw_id_fields = ('user',)
