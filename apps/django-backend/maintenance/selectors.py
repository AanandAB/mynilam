"""
Read-only queries for the maintenance domain (django-style-guide "selectors").

Selectors are pure query functions — no side effects. They return QuerySets with
related objects pre-fetched (`select_related`) to avoid N+1 queries. Business
logic lives in `services.py`; views call both.

NOTE: `CommonModel.objects` (the default manager) already filters out soft-deleted
and inactive rows, so selectors only express the domain filter (who sees what).
"""
from django.db.models import QuerySet

from maintenance.models import MaintenanceCategory, MaintenanceRequest


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

def get_categories() -> QuerySet[MaintenanceCategory]:
    """All active maintenance categories, alphabetically ordered."""
    return MaintenanceCategory.objects.order_by('name')


# ---------------------------------------------------------------------------
# Maintenance requests
# ---------------------------------------------------------------------------

def get_reported_requests(*, user) -> QuerySet[MaintenanceRequest]:
    """Requests the user filed themselves (tenant view)."""
    return (
        MaintenanceRequest.objects.filter(reported_by=user)
        .select_related('property', 'property__city', 'category', 'reported_by', 'assigned_to', 'lease')
        .order_by('-created_at')
    )


def get_received_requests(*, user) -> QuerySet[MaintenanceRequest]:
    """Requests filed against properties the user owns (landlord view)."""
    return (
        MaintenanceRequest.objects.filter(property__owner=user)
        .select_related('property', 'property__city', 'category', 'reported_by', 'assigned_to', 'lease')
        .order_by('-created_at')
    )


def get_request(*, request_id: int) -> MaintenanceRequest:
    """A single request with every related object pre-fetched for serialization."""
    return (
        MaintenanceRequest.objects
        .select_related(
            'property', 'property__city', 'property__owner',
            'category', 'reported_by', 'assigned_to', 'lease',
        )
        .get(pk=request_id)
    )
