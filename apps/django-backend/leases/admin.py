from django.contrib import admin
from .models import LeaseApplication, LeaseContract, LeasePayment, LeaseInvoice

@admin.register(LeaseApplication)
class LeaseApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'applicant', 'application_status', 'proposed_move_in_date', 'is_active')
    list_filter = ('application_status', 'is_active')
    raw_id_fields = ('property', 'applicant', 'reviewed_by')

@admin.register(LeaseContract)
class LeaseContractAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'tenant', 'landlord', 'lease_status', 'lease_end_date', 'is_active')
    list_filter = ('lease_status', 'is_active')
    raw_id_fields = ('application', 'property', 'tenant', 'landlord', 'terminated_by')

@admin.register(LeasePayment)
class LeasePaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'lease', 'payer', 'payment_type', 'amount', 'payment_status', 'payment_date')
    list_filter = ('payment_type', 'payment_status', 'payment_method')
    raw_id_fields = ('lease', 'payer')

@admin.register(LeaseInvoice)
class LeaseInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'lease', 'total_amount', 'due_date', 'invoice_status')
    list_filter = ('invoice_status',)
    search_fields = ('invoice_number',)
    raw_id_fields = ('lease', 'payment')
