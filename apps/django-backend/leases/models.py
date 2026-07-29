from django.db import models
from django.conf import settings
from core.models import CommonModel
from django.core.validators import MinValueValidator, MaxValueValidator


class LeaseApplication(CommonModel):
    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('UnderReview', 'UnderReview'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Withdrawn', 'Withdrawn'),
        ('Expired', 'Expired')
    ]
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='lease_applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    proposed_rent_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    proposed_move_in_date = models.DateField()
    proposed_lease_duration_months = models.IntegerField()
    cover_letter = models.TextField(null=True, blank=True)
    application_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Submitted')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_applications'
    )
    review_notes = models.CharField(max_length=1000, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"App {self.id} for {self.property.title} by {self.applicant.email}"


class LeaseContract(CommonModel):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Expired', 'Expired'),
        ('Terminated', 'Terminated'),
        ('Renewed', 'Renewed'),
        ('Pending', 'Pending')
    ]
    application = models.ForeignKey(LeaseApplication, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts')
    property = models.ForeignKey('properties.Property', on_delete=models.RESTRICT, related_name='contracts')
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='tenant_leases')
    landlord = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='landlord_leases')
    
    lease_start_date = models.DateField()
    lease_end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=14, decimal_places=2)
    currency_code = models.CharField(max_length=3)
    security_deposit_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    
    payment_day_of_month = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(28)])
    rent_escalation_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lease_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    
    termination_reason = models.CharField(max_length=500, null=True, blank=True)
    terminated_at = models.DateTimeField(null=True, blank=True)
    terminated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='terminated_leases'
    )
    contract_document_url = models.URLField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f"Lease {self.id} - {self.property.title}"


class LeasePayment(CommonModel):
    TYPE_CHOICES = [
        ('Rent', 'Rent'),
        ('SecurityDeposit', 'SecurityDeposit'),
        ('LateFee', 'LateFee'),
        ('MaintenanceFee', 'MaintenanceFee'),
        ('Refund', 'Refund'),
        ('Other', 'Other')
    ]
    METHOD_CHOICES = [
        ('CreditCard', 'CreditCard'),
        ('BankTransfer', 'BankTransfer'),
        ('Cash', 'Cash'),
        ('Cheque', 'Cheque'),
        ('Digital', 'Digital')
    ]
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
        ('Refunded', 'Refunded'),
        ('Partial', 'Partial')
    ]
    lease = models.ForeignKey(LeaseContract, on_delete=models.CASCADE, related_name='payments')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='payments_made')
    payment_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency_code = models.CharField(max_length=3)
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES, null=True, blank=True)
    transaction_reference = models.CharField(max_length=200, null=True, blank=True)
    payment_date = models.DateField()
    due_date = models.DateField()
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    receipt_url = models.URLField(max_length=1000, null=True, blank=True)
    notes = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return f"{self.payment_type} {self.amount} for Lease {self.lease.id}"


class LeaseInvoice(CommonModel):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Sent', 'Sent'),
        ('Paid', 'Paid'),
        ('Overdue', 'Overdue'),
        ('Cancelled', 'Cancelled'),
        ('PartiallyPaid', 'PartiallyPaid')
    ]
    lease = models.ForeignKey(LeaseContract, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency_code = models.CharField(max_length=3)
    due_date = models.DateField()
    invoice_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    payment = models.ForeignKey(LeasePayment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_pdf_url = models.URLField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return f"Invoice {self.invoice_number}"
