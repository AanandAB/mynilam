"""
Business logic for the leases domain (django-style-guide "services").

Services contain all the mutation logic + permission checks. Views stay thin and
just validate input (via `api/serializers.py`) then delegate here. Permission
failures raise `PermissionError`; validation failures raise `ValueError` — the
views map these to 403 / 400 responses.
"""
import uuid

from django.contrib.auth import get_user_model
from django.utils import timezone

from leases.models import LeaseApplication, LeaseContract, LeasePayment, LeaseInvoice
from properties.models import Property

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_landlord(user, property) -> bool:
    """True if the user owns the property or is a superuser."""
    return user.is_superuser or property.owner_id == user.id


def _assert_landlord(user, property) -> None:
    if not _is_landlord(user, property):
        raise PermissionError("Only the property owner can perform this action.")


# ---------------------------------------------------------------------------
# Lease applications
# ---------------------------------------------------------------------------

def create_lease_application(
    *,
    user,
    property_id: int,
    proposed_move_in_date,
    proposed_lease_duration_months: int,
    proposed_rent_amount=None,
    cover_letter=None,
) -> LeaseApplication:
    property = Property.objects.get(pk=property_id)
    if property.owner_id == user.id:
        raise ValueError("You cannot apply to your own property.")

    return LeaseApplication.objects.create(
        property=property,
        applicant=user,
        proposed_rent_amount=proposed_rent_amount,
        proposed_move_in_date=proposed_move_in_date,
        proposed_lease_duration_months=proposed_lease_duration_months,
        cover_letter=cover_letter,
    )


def update_application_status(
    *, user, application_id: int, status: str, review_notes=None
) -> LeaseApplication:
    application = LeaseApplication.objects.select_related('property').get(pk=application_id)
    _assert_landlord(user, application.property)

    application.application_status = status
    application.reviewed_by = user
    application.review_notes = review_notes
    application.reviewed_at = timezone.now()
    application.save(update_fields=['application_status', 'reviewed_by', 'review_notes', 'reviewed_at'])
    return application


# ---------------------------------------------------------------------------
# Lease contracts
# ---------------------------------------------------------------------------

def create_lease_contract(
    *,
    user,
    property_id: int,
    tenant_id: int,
    lease_start_date,
    lease_end_date,
    monthly_rent,
    currency_code: str = 'INR',
    security_deposit_amount=None,
    application_id: int = None,
    payment_day_of_month: int = 1,
    rent_escalation_percent=None,
) -> LeaseContract:
    property = Property.objects.get(pk=property_id)
    _assert_landlord(user, property)
    tenant = User.objects.get(pk=tenant_id)

    return LeaseContract.objects.create(
        property=property,
        tenant=tenant,
        landlord=user,
        application_id=application_id,
        lease_start_date=lease_start_date,
        lease_end_date=lease_end_date,
        monthly_rent=monthly_rent,
        currency_code=currency_code,
        security_deposit_amount=security_deposit_amount,
        payment_day_of_month=payment_day_of_month,
        rent_escalation_percent=rent_escalation_percent,
    )


def update_contract_status(
    *, user, contract_id: int, status: str, termination_reason=None
) -> LeaseContract:
    contract = LeaseContract.objects.get(pk=contract_id)
    if not (user.is_superuser or contract.landlord_id == user.id):
        raise PermissionError("Only the landlord can update the lease status.")

    contract.lease_status = status
    if status == 'Terminated':
        contract.termination_reason = termination_reason
        contract.terminated_by = user
        contract.terminated_at = timezone.now()
    contract.save()
    return contract


# ---------------------------------------------------------------------------
# Lease payments (manual tracking; Razorpay placeholder for the future)
# ---------------------------------------------------------------------------

def record_lease_payment(
    *,
    user,
    lease_id: int,
    payment_type: str,
    amount,
    payment_date,
    payment_method=None,
    transaction_reference=None,
    due_date=None,
    notes=None,
) -> LeasePayment:
    lease = LeaseContract.objects.select_related('tenant', 'landlord').get(pk=lease_id)

    if user.is_superuser or lease.landlord_id == user.id:
        # Landlord records a payment received from the tenant.
        payer = lease.tenant
        default_status = 'Completed'
    elif lease.tenant_id == user.id:
        # Tenant records a payment they made (landlord confirms later).
        payer = user
        default_status = 'Pending'
    else:
        raise PermissionError("You are not a party to this lease.")

    return LeasePayment.objects.create(
        lease=lease,
        payer=payer,
        payment_type=payment_type,
        amount=amount,
        currency_code=lease.currency_code,
        payment_method=payment_method,
        transaction_reference=transaction_reference,
        payment_date=payment_date,
        due_date=due_date or payment_date,
        payment_status=default_status,
        notes=notes,
    )


def update_payment_status(*, user, payment_id: int, status: str) -> LeasePayment:
    payment = LeasePayment.objects.select_related('lease').get(pk=payment_id)
    if not (user.is_superuser or payment.lease.landlord_id == user.id):
        raise PermissionError("Only the landlord can update the payment status.")
    payment.payment_status = status
    payment.save(update_fields=['payment_status'])
    return payment


# ---------------------------------------------------------------------------
# Lease invoices
# ---------------------------------------------------------------------------

def create_lease_invoice(
    *,
    user,
    lease_id: int,
    billing_period_start,
    billing_period_end,
    subtotal,
    tax_amount=0.0,
    due_date=None,
) -> LeaseInvoice:
    lease = LeaseContract.objects.select_related('property').get(pk=lease_id)
    _assert_landlord(user, lease.property)

    total_amount = subtotal + tax_amount
    return LeaseInvoice.objects.create(
        lease=lease,
        invoice_number=f"INV-{uuid.uuid4().hex[:10].upper()}",
        billing_period_start=billing_period_start,
        billing_period_end=billing_period_end,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total_amount,
        currency_code=lease.currency_code,
        due_date=due_date or billing_period_end,
    )
