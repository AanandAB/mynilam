"""URL routes for the leases API (mounted under /api/leases/)."""
from django.urls import path

from leases.api.views import (
    LeaseApplicationListView,
    LeaseApplicationCreateView,
    LeaseApplicationDetailView,
    LeaseApplicationStatusUpdateView,
    LeaseContractListView,
    LeaseContractCreateView,
    LeaseContractDetailView,
    LeaseContractStatusUpdateView,
    LeasePaymentListView,
    LeasePaymentCreateView,
    LeasePaymentStatusUpdateView,
    LeaseInvoiceListView,
    LeaseInvoiceCreateView,
    LeaseInvoiceDetailView,
)

urlpatterns = [
    # Applications
    path('applications/', LeaseApplicationListView.as_view(), name='lease-application-list'),
    path('applications/create/', LeaseApplicationCreateView.as_view(), name='lease-application-create'),
    path('applications/<int:pk>/', LeaseApplicationDetailView.as_view(), name='lease-application-detail'),
    path('applications/<int:pk>/status/', LeaseApplicationStatusUpdateView.as_view(), name='lease-application-status'),

    # Contracts
    path('contracts/', LeaseContractListView.as_view(), name='lease-contract-list'),
    path('contracts/create/', LeaseContractCreateView.as_view(), name='lease-contract-create'),
    path('contracts/<int:pk>/', LeaseContractDetailView.as_view(), name='lease-contract-detail'),
    path('contracts/<int:pk>/status/', LeaseContractStatusUpdateView.as_view(), name='lease-contract-status'),

    # Payments (manual tracking)
    path('payments/', LeasePaymentListView.as_view(), name='lease-payment-list'),
    path('payments/create/', LeasePaymentCreateView.as_view(), name='lease-payment-create'),
    path('payments/<int:pk>/status/', LeasePaymentStatusUpdateView.as_view(), name='lease-payment-status'),

    # Invoices
    path('invoices/', LeaseInvoiceListView.as_view(), name='lease-invoice-list'),
    path('invoices/create/', LeaseInvoiceCreateView.as_view(), name='lease-invoice-create'),
    path('invoices/<int:pk>/', LeaseInvoiceDetailView.as_view(), name='lease-invoice-detail'),
]
