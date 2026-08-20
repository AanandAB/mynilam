"""
Input serializers for the maintenance domain.

These are plain DRF `Serializer` classes used only to VALIDATE incoming request
payloads (matching the pattern in `leases/api/serializers.py`). Output
serialization is done with the module-level `serialize_*` helpers in
`api/views.py` so the response shape stays under our control (`{success, data}`
envelope).
"""
from rest_framework import serializers


class MaintenanceRequestCreateSerializer(serializers.Serializer):
    """Payload for a tenant (or property owner) raising a maintenance request."""
    property_id = serializers.IntegerField()
    category_id = serializers.IntegerField()
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=['Low', 'Medium', 'High', 'Urgent'],
        required=False,
        default='Medium',
    )
    lease_id = serializers.IntegerField(required=False, allow_null=True)


class MaintenanceRequestStatusUpdateSerializer(serializers.Serializer):
    """Payload for a landlord advancing a request through its lifecycle.

    `status` is one of the non-initial states; `Submitted` is the default the
    model starts with, so it is never a target of an update.
    """
    status = serializers.ChoiceField(
        choices=['Acknowledged', 'InProgress', 'OnHold', 'Completed', 'Cancelled']
    )
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    scheduled_date = serializers.DateField(required=False, allow_null=True)
    resolution_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    estimated_cost = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
    actual_cost = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, allow_null=True)
