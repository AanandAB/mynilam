"""
API views for the leases domain.

Follows the same convention as `communications/api/views.py`:
- `APIView` subclasses with `CustomJWTAuthentication` + `IsAuthenticated`.
- Module-level `serialize_*` helpers that produce the exact response shape.
- Thin views: validate input, delegate to `services.py`, wrap in the
  `{"success": bool, "data" | "error": {...}}` envelope.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.jwt import CustomJWTAuthentication
from leases.api.serializers import (
    LeaseApplicationCreateSerializer,
    LeaseApplicationStatusUpdateSerializer,
    LeaseContractCreateSerializer,
    LeaseContractStatusUpdateSerializer,
    LeasePaymentCreateSerializer,
    LeasePaymentStatusUpdateSerializer,
    LeaseInvoiceCreateSerializer,
)
from leases import selectors, services


# ---------------------------------------------------------------------------
# Serialize helpers (output shape)
# ---------------------------------------------------------------------------

def _user_brief(user):
    if not user:
        return None
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": str(user.id),
        "full_name": full_name or user.email,
        "email": user.email,
    }


def _property_brief(property):
    if not property:
        return None
    return {
        "id": str(property.id),
        "title": property.title,
        "city": property.city.name if property.city else "",
    }


def serialize_application(app):
    return {
        "id": str(app.id),
        "property": _property_brief(app.property),
        "applicant": _user_brief(app.applicant),
        "proposed_rent_amount": str(app.proposed_rent_amount) if app.proposed_rent_amount is not None else None,
        "proposed_move_in_date": app.proposed_move_in_date.isoformat(),
        "proposed_lease_duration_months": app.proposed_lease_duration_months,
        "cover_letter": app.cover_letter,
        "status": app.application_status,
        "reviewed_by": _user_brief(app.reviewed_by),
        "review_notes": app.review_notes,
        "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
        "created_at": app.created_at.isoformat() if hasattr(app, 'created_at') and app.created_at else "",
    }


def serialize_contract(contract):
    return {
        "id": str(contract.id),
        "property": _property_brief(contract.property),
        "tenant": _user_brief(contract.tenant),
        "landlord": _user_brief(contract.landlord),
        "application_id": str(contract.application_id) if contract.application_id else None,
        "lease_start_date": contract.lease_start_date.isoformat(),
        "lease_end_date": contract.lease_end_date.isoformat(),
        "monthly_rent": str(contract.monthly_rent),
        "currency_code": contract.currency_code,
        "security_deposit_amount": str(contract.security_deposit_amount) if contract.security_deposit_amount is not None else None,
        "payment_day_of_month": contract.payment_day_of_month,
        "rent_escalation_percent": str(contract.rent_escalation_percent) if contract.rent_escalation_percent is not None else None,
        "status": contract.lease_status,
        "termination_reason": contract.termination_reason,
        "created_at": contract.created_at.isoformat() if hasattr(contract, 'created_at') and contract.created_at else "",
    }


def serialize_payment(payment):
    return {
        "id": str(payment.id),
        "lease_id": str(payment.lease_id),
        "property": _property_brief(payment.lease.property) if hasattr(payment.lease, 'property') else None,
        "payer": _user_brief(payment.payer),
        "payment_type": payment.payment_type,
        "amount": str(payment.amount),
        "currency_code": payment.currency_code,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "payment_date": payment.payment_date.isoformat(),
        "due_date": payment.due_date.isoformat() if payment.due_date else None,
        "status": payment.payment_status,
        "notes": payment.notes,
        "created_at": payment.created_at.isoformat() if hasattr(payment, 'created_at') and payment.created_at else "",
    }


def serialize_invoice(invoice):
    return {
        "id": str(invoice.id),
        "lease_id": str(invoice.lease_id),
        "invoice_number": invoice.invoice_number,
        "billing_period_start": invoice.billing_period_start.isoformat(),
        "billing_period_end": invoice.billing_period_end.isoformat(),
        "subtotal": str(invoice.subtotal),
        "tax_amount": str(invoice.tax_amount),
        "total_amount": str(invoice.total_amount),
        "currency_code": invoice.currency_code,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "status": invoice.invoice_status,
        "created_at": invoice.created_at.isoformat() if hasattr(invoice, 'created_at') and invoice.created_at else "",
    }


# ---------------------------------------------------------------------------
# Lease applications
# ---------------------------------------------------------------------------

class LeaseApplicationListView(APIView):
    """GET — list applications. `?type=sent|received` (default sent)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        app_type = request.query_params.get("type", "sent")
        if app_type == "received":
            applications = selectors.get_received_applications(user=request.user)
        else:
            applications = selectors.get_sent_applications(user=request.user)

        data = [serialize_application(a) for a in applications]
        return Response({
            "success": True,
            "data": data,
            "message": "Applications retrieved successfully",
            "pagination": {"total": len(data), "page": 1, "limit": max(len(data), 1), "total_pages": 1},
        }, status=status.HTTP_200_OK)


class LeaseApplicationCreateView(APIView):
    """POST — submit a lease application on a property."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LeaseApplicationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = services.create_lease_application(user=request.user, **serializer.validated_data)
            return Response({"success": True, "data": serialize_application(application), "message": "Application submitted successfully"}, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while submitting the application"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeaseApplicationDetailView(APIView):
    """GET — retrieve a single application (owner, applicant, or superuser)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            application = selectors.get_application(application_id=pk)
        except Exception:
            return Response({"success": False, "error": {"message": "Application not found"}}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_superuser or application.applicant_id == request.user.id or application.property.owner_id == request.user.id):
            return Response({"success": False, "error": {"message": "You do not have access to this application"}}, status=status.HTTP_403_FORBIDDEN)

        return Response({"success": True, "data": serialize_application(application)}, status=status.HTTP_200_OK)


class LeaseApplicationStatusUpdateView(APIView):
    """PATCH — landlord reviews an application (approve/reject/under-review)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        serializer = LeaseApplicationStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            application = services.update_application_status(user=request.user, application_id=pk, **serializer.validated_data)
            return Response({"success": True, "data": serialize_application(application), "message": "Application status updated"}, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while updating the application"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Lease contracts
# ---------------------------------------------------------------------------

class LeaseContractListView(APIView):
    """GET — list contracts where the user is tenant or landlord."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        contracts = selectors.get_user_contracts(user=request.user)
        data = [serialize_contract(c) for c in contracts]
        return Response({"success": True, "data": data, "message": "Contracts retrieved successfully"}, status=status.HTTP_200_OK)


class LeaseContractCreateView(APIView):
    """POST — landlord creates a lease contract."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LeaseContractCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            contract = services.create_lease_contract(user=request.user, **serializer.validated_data)
            return Response({"success": True, "data": serialize_contract(contract), "message": "Contract created successfully"}, status=status.HTTP_201_CREATED)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while creating the contract"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeaseContractDetailView(APIView):
    """GET — retrieve a single contract (tenant, landlord, or superuser)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            contract = selectors.get_contract(contract_id=pk)
        except Exception:
            return Response({"success": False, "error": {"message": "Contract not found"}}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_superuser or contract.tenant_id == request.user.id or contract.landlord_id == request.user.id):
            return Response({"success": False, "error": {"message": "You do not have access to this contract"}}, status=status.HTTP_403_FORBIDDEN)

        return Response({"success": True, "data": serialize_contract(contract)}, status=status.HTTP_200_OK)


class LeaseContractStatusUpdateView(APIView):
    """PATCH — landlord terminates/renews a lease."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        serializer = LeaseContractStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            contract = services.update_contract_status(user=request.user, contract_id=pk, **serializer.validated_data)
            return Response({"success": True, "data": serialize_contract(contract), "message": "Lease status updated"}, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while updating the lease"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Lease payments (manual tracking)
# ---------------------------------------------------------------------------

class LeasePaymentListView(APIView):
    """GET — list payments for leases the user is a party to."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        payments = selectors.get_lease_payments(user=request.user)
        data = [serialize_payment(p) for p in payments]
        return Response({"success": True, "data": data, "message": "Payments retrieved successfully"}, status=status.HTTP_200_OK)


class LeasePaymentCreateView(APIView):
    """POST — record a manual payment (landlord records received; tenant records made)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LeasePaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = services.record_lease_payment(user=request.user, **serializer.validated_data)
            return Response({"success": True, "data": serialize_payment(payment), "message": "Payment recorded successfully"}, status=status.HTTP_201_CREATED)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while recording the payment"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeasePaymentStatusUpdateView(APIView):
    """PATCH — landlord updates a payment's status."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        serializer = LeasePaymentStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = services.update_payment_status(user=request.user, payment_id=pk, **serializer.validated_data)
            return Response({"success": True, "data": serialize_payment(payment), "message": "Payment status updated"}, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while updating the payment"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------------
# Lease invoices
# ---------------------------------------------------------------------------

class LeaseInvoiceListView(APIView):
    """GET — list invoices for leases the user is a party to."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        invoices = selectors.get_lease_invoices(user=request.user)
        data = [serialize_invoice(i) for i in invoices]
        return Response({"success": True, "data": data, "message": "Invoices retrieved successfully"}, status=status.HTTP_200_OK)


class LeaseInvoiceCreateView(APIView):
    """POST — landlord generates an invoice for a lease."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LeaseInvoiceCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invoice = services.create_lease_invoice(user=request.user, **serializer.validated_data)
            return Response({"success": True, "data": serialize_invoice(invoice), "message": "Invoice generated successfully"}, status=status.HTTP_201_CREATED)
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response({"success": False, "error": {"message": "An error occurred while generating the invoice"}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeaseInvoiceDetailView(APIView):
    """GET — retrieve a single invoice (tenant, landlord, or superuser)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            invoice = selectors.get_invoice(invoice_id=pk)
        except Exception:
            return Response({"success": False, "error": {"message": "Invoice not found"}}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_superuser or invoice.lease.tenant_id == request.user.id or invoice.lease.landlord_id == request.user.id):
            return Response({"success": False, "error": {"message": "You do not have access to this invoice"}}, status=status.HTTP_403_FORBIDDEN)

        return Response({"success": True, "data": serialize_invoice(invoice)}, status=status.HTTP_200_OK)
