from django.db import transaction
from communications.models import Favorite
from properties.models import Property

def toggle_favorite(*, user, property_id: int) -> bool:
    """
    Toggles a property favorite for a user.
    Returns True if favorited, False if unfavorited.
    """
    with transaction.atomic():
        favorite, created = Favorite.objects.get_or_create(
            user=user,
            property_id=property_id
        )
        
        if not created:
            favorite.delete()
            return False
            
        return True

def check_favorite(*, user, property_id: int) -> bool:
    """Checks if a user has favorited a property."""
    return Favorite.objects.filter(user=user, property_id=property_id).exists()


def create_inquiry(*, user, property_id: int, message: str, phone: str = None):
    """
    Creates an inquiry for a property.
    Validates the property exists and gets the owner as recipient.
    """
    from communications.models import Inquiry
    
    # Rate limit: max 3 pending/responded inquiries per user per property
    active_inquiries = Inquiry.objects.filter(
        sender=user, 
        property_id=property_id,
        inquiry_status__in=['Pending', 'Responded']
    ).count()
    
    if active_inquiries >= 3:
        raise ValueError("You have reached the maximum number of active inquiries for this property.")
        
    property_obj = Property.objects.get(id=property_id)
    recipient = property_obj.owner
    
    if user == recipient:
        raise ValueError("You cannot send an inquiry to your own property.")
        
    inquiry = Inquiry.objects.create(
        property=property_obj,
        sender=user,
        recipient=recipient,
        message=message,
        phone=phone,
        inquiry_status='Pending'
    )
    return inquiry

def accept_inquiry(*, user, inquiry_id: int):
    """
    Accepts an inquiry. Only the recipient can accept it.
    """
    from communications.models import Inquiry
    
    inquiry = Inquiry.objects.get(id=inquiry_id)
    
    if inquiry.recipient != user:
        raise PermissionError("Only the recipient can accept an inquiry.")
        
    if inquiry.inquiry_status == 'Closed':
        raise ValueError("Cannot accept a closed inquiry.")
        
    inquiry.inquiry_status = 'Accepted'
    inquiry.save(update_fields=['inquiry_status'])
    return inquiry


def create_review(*, user, property_id: int, overall_rating: int, title: str = None, body: str = None):
    """
    Creates a review for a property. Only one review per user per property.
    """
    from communications.models import Review
    
    if not (1 <= overall_rating <= 5):
        raise ValueError("overall_rating must be between 1 and 5")
        
    property_obj = Property.objects.get(id=property_id)
    
    # Check if user already reviewed this property
    if Review.objects.filter(reviewer=user, reviewee_type='Property', reviewee_id=property_id).exists():
        raise ValueError("You have already reviewed this property.")
        
    review = Review.objects.create(
        reviewer=user,
        reviewee_type='Property',
        reviewee_id=property_id,
        overall_rating=overall_rating,
        title=title,
        body=body,
        status='Published'  # Assuming auto-publish for now
    )
    return review

def moderate_review(*, user, review_id: int, action: str, notes: str = None):
    """
    Employee action to moderate a review.
    """
    from communications.models import Review
    
    if not user.is_staff and not user.is_superuser:
        raise PermissionError("Only staff can moderate reviews.")
        
    valid_actions = ['Published', 'Flagged', 'Removed']
    if action not in valid_actions:
        raise ValueError(f"action must be one of {valid_actions}")
        
    review = Review.objects.get(id=review_id)
    review.status = action
    if notes:
        review.moderation_notes = notes
    review.save()
    
    return review


def get_or_create_conversation(*, user, other_user_id: int, property_id: int = None, subject: str = None):
    """
    Finds existing conversation between two users for a property, or creates a new one.
    """
    from communications.models import Conversation, ConversationParticipant
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    User = get_user_model()
    
    other_user = User.objects.get(id=other_user_id)
    
    if user == other_user:
        raise ValueError("Cannot start conversation with yourself.")
        
    # Check if a conversation already exists
    conversations = Conversation.objects.filter(
        participants__user=user
    ).filter(
        participants__user=other_user
    )
    
    if property_id:
        conversations = conversations.filter(property_id=property_id)
        
    existing_conv = conversations.first()
    if existing_conv:
        return existing_conv
        
    # Create new
    with transaction.atomic():
        conv = Conversation.objects.create(
            property_id=property_id,
            subject=subject,
            conversation_type='General',
            last_message_at=timezone.now()
        )
        
        ConversationParticipant.objects.create(conversation=conv, user=user)
        ConversationParticipant.objects.create(conversation=conv, user=other_user)
        
    return conv

def send_message(*, user, conversation_id: int, body: str):
    """
    Sends a message in a conversation. User must be a participant.
    """
    from communications.models import Conversation, ConversationParticipant, Message
    from django.utils import timezone
    
    try:
        conv = Conversation.objects.get(id=conversation_id)
    except Conversation.DoesNotExist:
        raise ValueError("Conversation not found.")
        
    if not ConversationParticipant.objects.filter(conversation=conv, user=user).exists():
        raise PermissionError("You are not a participant in this conversation.")
        
    with transaction.atomic():
        message = Message.objects.create(
            conversation=conv,
            sender=user,
            body=body,
            message_type='Text'
        )
        
        conv.last_message_at = timezone.now()
        conv.save(update_fields=['last_message_at'])

    # Real-time delivery + async notification, scheduled AFTER the transaction
    # commits so connected clients never receive a message that isn't persisted
    # yet (and the Celery task always reads a committed row).
    from communications.realtime import broadcast_message
    from communications.tasks import notify_new_message
    transaction.on_commit(lambda: broadcast_message(message))
    transaction.on_commit(lambda: notify_new_message.delay(
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        message_body=message.body,
    ))

    return message
