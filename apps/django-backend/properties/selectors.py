from django.db.models import QuerySet
from properties.models import PropertyVisit, Property

def get_properties_list() -> QuerySet:
    return Property.objects.select_related(
        'owner', 'city', 'state', 'area', 'property_type'
    ).prefetch_related(
        'media', 'hostel_config', 'hostel_config__photos'
    ).order_by('-created_at')


def get_user_visits(*, user) -> QuerySet:
    """Returns visit requests made by the user."""
    return PropertyVisit.objects.filter(
        visitor=user
    ).select_related(
        'property', 'property__city'
    ).order_by('-visit_date', '-visit_time')

def get_property_visit_requests(*, owner_user) -> QuerySet:
    """Returns visit requests for properties owned by the user."""
    return PropertyVisit.objects.filter(
        property__owner=owner_user
    ).select_related(
        'property', 'visitor'
    ).order_by('-visit_date', '-visit_time')

def get_hostel_config(*, property_id: int):
    """Returns the hostel configuration for a property."""
    from properties.models import HostelConfig
    try:
        return HostelConfig.objects.get(property_id=property_id)
    except HostelConfig.DoesNotExist:
        return None

def can_see_exact_location(user, property_obj) -> bool:
    """
    Determines if a user has permission to see the exact coordinates of a property.
    """
    if not user.is_authenticated:
        return False
        
    if property_obj.owner == user:
        return True
        
    if user.is_staff or user.is_superuser:
        return True
        
    from communications.models import Inquiry, ConversationParticipant
    
    # Check for accepted inquiry
    has_accepted_inquiry = Inquiry.objects.filter(
        property=property_obj,
        sender=user,
        inquiry_status='Accepted'
    ).exists()
    
    if has_accepted_inquiry:
        return True
        
    # Check for active conversation
    has_conversation = ConversationParticipant.objects.filter(
        user=user,
        conversation__property=property_obj,
        conversation__participants__user=property_obj.owner
    ).exists()
    
    if has_conversation:
        return True
        
    return False
