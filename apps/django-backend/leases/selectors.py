"""
Read-only queries for the leases domain (django-style-guide "selectors").

Selectors are pure query functions — no side effects. They return QuerySets with
related objects pre-fetched (`select_related` / `prefetch_related`) to avoid N+1
queries. Business logic lives in `services.py`; views call both.
"""
from django.db.models import Q, QuerySet

from leases.models import LeaseApplication, LeaseContract, LeasePayment, LeaseInvoice


# ---------------------------------------------------------------------------
# Lease applications
# ---------------------------------------------------------------------------

def get_sent_applications(*, user) -> QuerySet[LeaseApplication]:
    """Applications submitted BY the user (as an applicant)."""
    return (
        LeaseApplication.objects.filter(applicant=user)
        .select_related('property', 'property__owner', 'reviewed_by')
        .order_by('-created_at')
    )


def get_received_applications(*, user) -> QuerySet[LeaseApplication]:
    """Applications received FOR properties the user owns (as a landlord)."""
    return (
        LeaseApplication.objects.filter(property__owner=user)
        .select_related('property', 'applicant', 'reviewed_by')
        .order_by('-created_at')
    )


def get_application(*, application_id: int) -> LeaseApplication:
    return (
        LeaseApplication.objects
        .select_related('property', 'property__owner', 'applicant', 'reviewed_by')
        .get(pk=application_id)
    )


# ---------------------------------------------------------------------------
# Lease contracts
# ---------------------------------------------------------------------------

def get_user_contracts(*, user) -> QuerySet[LeaseContract]:
    """Contracts where the user is either the tenant or the landlord."""
    return (
        LeaseContract.objects.filter(Q(tenant=user) | Q(landlord=user))
        .select_related('property', 'tenant', 'landlord', 'application')
        .order_by('-created_at')
    )


def get_contract(*, contract_id: int) -> LeaseContract:
    return (
        LeaseContract.objects
        .select_related('property', 'tenant', 'landlord', 'application')
        .get(pk=contract_id)
    )


# ---------------------------------------------------------------------------
# Lease payments
# ---------------------------------------------------------------------------

def get_lease_payments(*, user) -> QuerySet[LeasePayment]:
    """Payments for leases where the user is tenant or landlord."""
    return (
        LeasePayment.objects.filter(Q(lease__tenant=user) | Q(lease__landlord=user))
        .select_related('lease', 'lease__property', 'payer')
        .order_by('-payment_date')
    )


# ---------------------------------------------------------------------------
# Lease invoices
# ---------------------------------------------------------------------------

def get_lease_invoices(*, user) -> QuerySet[LeaseInvoice]:
    """Invoices for leases where the user is tenant or landlord."""
    return (
        LeaseInvoice.objects.filter(Q(lease__tenant=user) | Q(lease__landlord=user))
        .select_related('lease', 'lease__property', 'payment')
        .order_by('-created_at')
    )


def get_invoice(*, invoice_id: int) -> LeaseInvoice:
    return (
        LeaseInvoice.objects
        .select_related('lease', 'lease__property', 'lease__tenant', 'lease__landlord', 'payment')
        .get(pk=invoice_id)
    )
