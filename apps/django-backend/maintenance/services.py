"""
Business logic for the maintenance domain (django-style-guide "services").

Services contain all the mutation logic + permission checks. Views stay thin and
just validate input (via `api/serializers.py`) then delegate here. Permission
failures raise `PermissionError`; validation failures raise `ValueError` — the
views map these to 403 / 400 responses.
"""
from django.contrib.auth import get_user_model
from django.utils import timezone

from leases.models import LeaseContract
from maintenance.models import MaintenanceCategory, MaintenanceRequest
from properties.models import Property

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_owner(user, property) -> bool:
    """True if the user owns the property or is a superuser."""
    return user.is_superuser or property.owner_id == user.id


def _is_tenant(user, property) -> bool:
    """True if the user holds an active lease on the property."""
    return LeaseContract.objects.filter(
        tenant=user,
        property=property,
        lease_status='Active',
    ).exists()


def _can_report(user, property) -> bool:
    """A request can be filed by the property owner OR an active tenant."""
    return _is_owner(user, property) or _is_tenant(user, property)


# Allowed status transitions. A request can only move to the states listed for
# its current status — this keeps the lifecycle sane (you can't "Complete" a
# request that was never started, and a Cancelled/Completed request is terminal).
TRANSITIONS = {
    'Submitted': {'Acknowledged', 'InProgress', 'Cancelled'},
    'Acknowledged': {'InProgress', 'Completed', 'Cancelled'},
    'InProgress': {'OnHold', 'Completed', 'Cancelled'},
    'OnHold': {'InProgress', 'Completed', 'Cancelled'},
    'Completed': set(),
    'Cancelled': set(),
}


# ---------------------------------------------------------------------------
# Maintenance requests
# ---------------------------------------------------------------------------

def create_maintenance_request(
    *,
    user,
    property_id: int,
    category_id: int,
    title: str,
    description: str,
    priority: str = 'Medium',
    lease_id: int = None,
) -> MaintenanceRequest:
    """Raise a new maintenance request on a property.

    Allowed for the property owner or a tenant with an active lease. If the
    reporter is a tenant and no `lease_id` is given, we auto-link their active
    lease on that property so the landlord sees the request in its lease context.
    """
    property = Property.objects.get(pk=property_id)
    if not _can_report(user, property):
        raise PermissionError("You must own or actively lease this property to raise a request.")

    category = MaintenanceCategory.objects.get(pk=category_id)

    # Auto-link the tenant's active lease when one isn't explicitly provided.
    lease = None
    if lease_id:
        lease = LeaseContract.objects.get(pk=lease_id)
    elif _is_tenant(user, property):
        lease = (
            LeaseContract.objects
            .filter(tenant=user, property=property, lease_status='Active')
            .order_by('-created_at')
            .first()
        )

    return MaintenanceRequest.objects.create(
        property=property,
        lease=lease,
        reported_by=user,
        category=category,
        title=title,
        description=description,
        priority=priority,
        status='Submitted',
    )


def update_request_status(
    *,
    user,
    request_id: int,
    status: str,
    assigned_to_id: int = None,
    scheduled_date=None,
    resolution_notes=None,
    estimated_cost=None,
    actual_cost=None,
) -> MaintenanceRequest:
    """Advance a maintenance request through its lifecycle.

    - The property owner (or superuser) can Acknowledge / InProgress / OnHold /
      Complete / Cancel.
    - The reporter can Cancel their own request while it is still open.
    - Marking `Completed` stamps `completed_date` and records resolution notes
      plus the actual cost (optional).
    """
    request = MaintenanceRequest.objects.select_related('property').get(pk=request_id)

    is_owner = _is_owner(user, request.property)
    is_reporter = request.reported_by_id == user.id

    if status == 'Cancelled':
        if not (is_owner or is_reporter):
            raise PermissionError("You are not allowed to cancel this request.")
    elif not is_owner:
        raise PermissionError("Only the property owner can update this request.")

    # Validate the transition ladder.
    allowed = TRANSITIONS.get(request.status, set())
    if status not in allowed:
        raise ValueError(f"Cannot move a request from '{request.status}' to '{status}'.")

    request.status = status

    if assigned_to_id is not None:
        if not User.objects.filter(pk=assigned_to_id).exists():
            raise ValueError("Assigned user does not exist.")
        request.assigned_to_id = assigned_to_id
    if scheduled_date is not None:
        request.scheduled_date = scheduled_date
    if resolution_notes is not None:
        request.resolution_notes = resolution_notes
    if estimated_cost is not None:
        request.estimated_cost = estimated_cost
    if actual_cost is not None:
        request.actual_cost = actual_cost

    if status == 'Completed':
        request.completed_date = timezone.now()

    request.save()
    return request
