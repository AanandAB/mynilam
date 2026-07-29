from django.urls import path
from .api.views import (
    PropertyListView, PropertyDetailView, PropertyPostAdsView, PropertyVerifyView,
    PropertyLocationView,
    VisitListView, VisitRequestView, VisitStatusUpdateView,
    HostelConfigDetailView, HostelConfigUpdateView, HostelCreateView,
    HostelPhotoListView, HostelPhotoUploadView, HostelPhotoCoverView, HostelPhotoDeleteView
)

from .api.room_views import HostelRoomListCreateView, HostelBedUpdateView, HostelRoomDetailView

urlpatterns = [
    path('', PropertyListView.as_view(), name='property-list'),
    path('<int:pk>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<int:pk>/location/', PropertyLocationView.as_view(), name='property-location'),
    path('<int:pk>/verify/', PropertyVerifyView.as_view(), name='property-verify'),
    path('post-ads/', PropertyPostAdsView.as_view(), name='property-post-ads'),
    
    path('visits/', VisitListView.as_view(), name='visit-list'),
    path('visits/request/', VisitRequestView.as_view(), name='visit-request'),
    path('visits/<int:pk>/status/', VisitStatusUpdateView.as_view(), name='visit-status-update'),
    
    path('<int:property_id>/hostel-config/', HostelConfigDetailView.as_view(), name='hostel-config-detail'),
    path('<int:property_id>/hostel-config/update/', HostelConfigUpdateView.as_view(), name='hostel-config-update'),
    path('<int:property_id>/hostel-photos/', HostelPhotoListView.as_view(), name='hostel-photo-list'),
    path('<int:property_id>/hostel-photos/upload/', HostelPhotoUploadView.as_view(), name='hostel-photo-upload'),
    path('<int:property_id>/hostel-photos/<int:photo_id>/set-cover/', HostelPhotoCoverView.as_view(), name='hostel-photo-set-cover'),
    path('<int:property_id>/hostel-photos/<int:photo_id>/', HostelPhotoDeleteView.as_view(), name='hostel-photo-delete'),
    path('hostels/', HostelCreateView.as_view(), name='hostel-create'),

    # Room & Bed Occupancy Management
    path('<int:property_id>/rooms/', HostelRoomListCreateView.as_view(), name='hostel-room-list-create'),
    path('rooms/<uuid:room_id>/', HostelRoomDetailView.as_view(), name='hostel-room-detail'),
    path('beds/<int:bed_id>/', HostelBedUpdateView.as_view(), name='hostel-bed-update'),
]