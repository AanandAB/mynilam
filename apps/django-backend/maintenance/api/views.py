"""
API views for the maintenance domain.

Follows the same convention as `leases/api/views.py`:
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
from maintenance.api.serializers import (
    MaintenanceRequestCreateSerializer,
    MaintenanceRequestStatusUpdateSerializer,
)
from maintenance import selectors, services


# ---------------------------------------------------------------------------
# Serialize helpers (output shape)
# ---------------------------------------------------------------------------

def _user_brief(user):
    if not user:
        return None
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {"id": str(user.id), "full_name": full_name or user.email, "email": user.email}


def _property_brief(property):
    if not property:
        return None
    return {
        "id": str(property.id),
        "title": property.title,
        "city": property.city.name if property.city else "",
    }


def serialize_category(category):
    return {"id": str(category.id), "name": category.name, "description": category.description}


def serialize_request(request):
    """Flatten a MaintenanceRequest into the JSON shape the frontend expects.

    Decimal fields are returned as strings to preserve precision (the frontend
    formats them with a currency helper). Dates use ISO-8601.
    """
    return {
        "id": str(request.id),
        "property": _property_brief(request.property),
        "category": {"id": str(request.category.id), "name": request.category.name},
        "reported_by": _user_brief(request.reported_by),
        "assigned_to": _user_brief(request.assigned_to),
        "lease_id": str(request.lease_id) if request.lease_id else None,
        "title": request.title,
        "description": request.description,
        "priority": request.priority,
        "status": request.status,
        "scheduled_date": request.scheduled_date.isoformat() if request.scheduled_date else None,
        "completed_date": request.completed_date.isoformat() if request.completed_date else None,
        "resolution_notes": request.resolution_notes,
        "estimated_cost": str(request.estimated_cost) if request.estimated_cost is not None else None,
        "actual_cost": str(request.actual_cost) if request.actual_cost is not None else None,
        "currency_code": request.currency_code,
        "created_at": request.created_at.isoformat() if request.created_at else "",
    }


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class MaintenanceCategoryListView(APIView):
    """GET — list available maintenance categories."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        categories = selectors.get_categories()
        data = [serialize_category(c) for c in categories]
        return Response(
            {"success": True, "data": data, "message": "Categories retrieved successfully"},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Maintenance requests
# ---------------------------------------------------------------------------

class MaintenanceRequestListView(APIView):
    """GET — list requests. `?type=reported|received` (default reported)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        req_type = request.query_params.get("type", "reported")
        if req_type == "received":
            requests = selectors.get_received_requests(user=request.user)
        else:
            requests = selectors.get_reported_requests(user=request.user)

        data = [serialize_request(r) for r in requests]
        return Response({
            "success": True,
            "data": data,
            "message": "Requests retrieved successfully",
            "pagination": {"total": len(data), "page": 1, "limit": max(len(data), 1), "total_pages": 1},
        }, status=status.HTTP_200_OK)


class MaintenanceRequestCreateView(APIView):
    """POST — raise a new maintenance request."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = MaintenanceRequestCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            req = services.create_maintenance_request(user=request.user, **serializer.validated_data)
            return Response(
                {"success": True, "data": serialize_request(req), "message": "Request raised successfully"},
                status=status.HTTP_201_CREATED,
            )
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            return Response(
                {"success": False, "error": {"message": "An error occurred while raising the request"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MaintenanceRequestDetailView(APIView):
    """GET — retrieve a single request (reporter, property owner, or superuser)."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            req = selectors.get_request(request_id=pk)
        except Exception:
            return Response(
                {"success": False, "error": {"message": "Request not found"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not (
            request.user.is_superuser
            or req.reported_by_id == request.user.id
            or req.property.owner_id == request.user.id
        ):
            return Response(
                {"success": False, "error": {"message": "You do not have access to this request"}},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({"success": True, "data": serialize_request(req)}, status=status.HTTP_200_OK)


class MaintenanceRequestStatusUpdateView(APIView):
    """PATCH — landlord (or reporter cancelling) advances the request lifecycle."""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        serializer = MaintenanceRequestStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"message": "Validation failed", "errors": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            req = services.update_request_status(user=request.user, request_id=pk, **serializer.validated_data)
            return Response(
                {"success": True, "data": serialize_request(req), "message": "Request status updated"},
                status=status.HTTP_200_OK,
            )
        except PermissionError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"success": False, "error": {"message": "An error occurred while updating the request"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
