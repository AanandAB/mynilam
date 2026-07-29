from django.db.models import QuerySet
from communications.models import Favorite
from properties.models import Property

def get_user_favorites(*, user) -> QuerySet[Favorite]:
    """
    Returns a queryset of Favorite objects for a user.
    Includes related property, owner, city, and state to avoid N+1 queries.
    """
    return Favorite.objects.filter(user=user).select_related(
        'property',
        'property__owner',
        'property__city',
        'property__city__district__state',
        'property__area'
    ).prefetch_related(
        'property__media'
    ).order_by('-created_at')

def get_favorite_property_ids(*, user) -> list[int]:
    """Returns a flat list of property IDs the user has favorited."""
    return list(Favorite.objects.filter(user=user).values_list('property_id', flat=True))


def get_received_inquiries(*, user) -> QuerySet:
    """Returns inquiries received by the user (as landlord)."""
    from communications.models import Inquiry
    return Inquiry.objects.filter(recipient=user).select_related(
        'property', 'sender'
    ).order_by('-created_at')

def get_sent_inquiries(*, user) -> QuerySet:
    """Returns inquiries sent by the user."""
    from communications.models import Inquiry
    return Inquiry.objects.filter(sender=user).select_related(
        'property', 'recipient'
    ).order_by('-created_at')


def get_property_reviews(*, property_id: int) -> QuerySet:
    from communications.models import Review
    return Review.objects.filter(
        reviewee_type='Property', 
        reviewee_id=property_id,
        status='Published'
    ).select_related('reviewer').order_by('-created_at')

def get_property_rating_summary(*, property_id: int) -> dict:
    from communications.models import Review
    from django.db.models import Avg, Count
    
    stats = Review.objects.filter(
        reviewee_type='Property', 
        reviewee_id=property_id,
        status='Published'
    ).aggregate(
        avg_rating=Avg('overall_rating'),
        count=Count('id')
    )
    return {
        "avg_rating": round(stats['avg_rating'], 1) if stats['avg_rating'] else 0,
        "count": stats['count']
    }

def get_pending_reviews() -> QuerySet:
    from communications.models import Review
    return Review.objects.filter(status='Pending').select_related('reviewer').order_by('-created_at')


def get_user_conversations(*, user) -> QuerySet:
    from communications.models import Conversation, Message
    from django.db.models import OuterRef, Subquery
    
    last_message = Message.objects.filter(
        conversation=OuterRef('pk')
    ).order_by('-created_at')
    
    return Conversation.objects.filter(
        participants__user=user
    ).prefetch_related(
        'participants__user'
    ).annotate(
        last_message_body=Subquery(last_message.values('body')[:1]),
        last_message_sender=Subquery(last_message.values('sender__first_name')[:1])
    ).order_by('-last_message_at')

def get_conversation_messages(*, conversation_id: int, user) -> QuerySet:
    from communications.models import ConversationParticipant, Message
    
    if not ConversationParticipant.objects.filter(conversation_id=conversation_id, user=user).exists():
        raise PermissionError("You are not a participant in this conversation.")
        
    return Message.objects.filter(
        conversation_id=conversation_id
    ).select_related('sender').order_by('created_at')
