"""
Input serializers for the leases domain.

These are plain DRF `Serializer` classes used only to VALIDATE incoming request
payloads (matching the pattern in `properties/api/serializers.py`). Output
serialization is done with the module-level `serialize_*` helpers in `api/views.py`
so the response shape stays under our control (`{success, data}` envelope).
"""
from rest_framework import serializers


class LeaseApplicationCreateSerializer(serializers.Serializer):
    """Payload for a tenant submitting a lease application on a property."""
    property_id = serializers.IntegerField()
    proposed_move_in_date = serializers.DateField()
    proposed_lease_duration_months = serializers.IntegerField(min_value=1)
    proposed_rent_amount = serializers.DecimalField(
        max_digits=14, decimal_places=2, required=False, allow_null=True
    )
    cover_letter = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class LeaseApplicationStatusUpdateSerializer(serializers.Serializer):
    """Payload for a landlord reviewing an application (approve/reject/etc.)."""
    status = serializers.ChoiceField(
        choices=['UnderReview', 'Approved', 'Rejected', 'Withdrawn', 'Expired']
    )
    review_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class LeaseContractCreateSerializer(serializers.Serializer):
    """Payload for a landlord creating a lease contract for a tenant."""
    property_id = serializers.IntegerField()
    tenant_id = serializers.IntegerField()
    application_id = serializers.IntegerField(required=False, allow_null=True)
    lease_start_date = serializers.DateField()
    lease_end_date = serializers.DateField()
    monthly_rent = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency_code = serializers.CharField(max_length=3, default='INR')
    security_deposit_amount = serializers.DecimalField(
        max_digits=14, decimal_places=2, required=False, allow_null=True
    )
    payment_day_of_month = serializers.IntegerField(min_value=1, max_value=28, default=1)
    rent_escalation_percent = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, allow_null=True
    )


class LeaseContractStatusUpdateSerializer(serializers.Serializer):
    """Payload for terminating/renewing a lease."""
    status = serializers.ChoiceField(choices=['Active', 'Expired', 'Terminated', 'Renewed', 'Pending'])
    termination_reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class LeasePaymentCreateSerializer(serializers.Serializer):
    """Payload for recording a manual lease payment.

    NOTE: Payments are recorded manually for now. A Razorpay integration is a
    planned future enhancement — when it lands, a `gateway` / `order_id` field
    will be added here rather than changing the whole flow.
    """
    lease_id = serializers.IntegerField()
    payment_type = serializers.ChoiceField(
        choices=['Rent', 'SecurityDeposit', 'LateFee', 'MaintenanceFee', 'Refund', 'Other']
    )
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    payment_method = serializers.ChoiceField(
        choices=['CreditCard', 'BankTransfer', 'Cash', 'Cheque', 'Digital'],
        required=False, allow_null=True,
    )
    transaction_reference = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payment_date = serializers.DateField()
    due_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class LeasePaymentStatusUpdateSerializer(serializers.Serializer):
    """Payload for a landlord updating a payment's status."""
    status = serializers.ChoiceField(
        choices=['Pending', 'Completed', 'Failed', 'Refunded', 'Partial']
    )


class LeaseInvoiceCreateSerializer(serializers.Serializer):
    """Payload for generating a lease invoice."""
    lease_id = serializers.IntegerField()
    billing_period_start = serializers.DateField()
    billing_period_end = serializers.DateField()
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2)
    tax_amount = serializers.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    due_date = serializers.DateField(required=False, allow_null=True)
