"""URL routes for the maintenance API (mounted under /api/maintenance/)."""
from django.urls import path

from maintenance.api.views import (
    MaintenanceCategoryListView,
    MaintenanceRequestListView,
    MaintenanceRequestCreateView,
    MaintenanceRequestDetailView,
    MaintenanceRequestStatusUpdateView,
)

urlpatterns = [
    # Categories
    path('categories/', MaintenanceCategoryListView.as_view(), name='maintenance-category-list'),

    # Requests
    path('requests/', MaintenanceRequestListView.as_view(), name='maintenance-request-list'),
    path('requests/create/', MaintenanceRequestCreateView.as_view(), name='maintenance-request-create'),
    path('requests/<int:pk>/', MaintenanceRequestDetailView.as_view(), name='maintenance-request-detail'),
    path('requests/<int:pk>/status/', MaintenanceRequestStatusUpdateView.as_view(), name='maintenance-request-status'),
]
