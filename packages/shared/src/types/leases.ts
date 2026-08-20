/**
 * Types for the leases domain (tenant <-> landlord rental lifecycle).
 *
 * Field names mirror the Django API's JSON output (snake_case), which is what
 * `leases/api/views.py` serialize_* helpers return. Decimal amounts are returned
 * as strings to preserve precision — format them in the UI with a currency helper.
 */

// Nested entity summaries returned by the leases API
export interface UserBrief {
  id: string
  full_name: string
  email: string
}

export interface PropertyBrief {
  id: string
  title: string
  city: string
}

// ---------------------------------------------------------------------------
// Lease applications
// ---------------------------------------------------------------------------
export type LeaseApplicationStatus =
  | 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Withdrawn' | 'Expired'

export interface LeaseApplication {
  id: string
  property: PropertyBrief
  applicant: UserBrief
  proposed_rent_amount: string | null
  proposed_move_in_date: string // YYYY-MM-DD
  proposed_lease_duration_months: number
  cover_letter: string | null
  status: LeaseApplicationStatus
  reviewed_by: UserBrief | null
  review_notes: string | null
  reviewed_at: string | null
  created_at: string
}

export interface CreateLeaseApplicationInput {
  property_id: number | string
  proposed_move_in_date: string
  proposed_lease_duration_months: number
  proposed_rent_amount?: number
  cover_letter?: string
}

export interface UpdateLeaseApplicationStatusInput {
  status: 'UnderReview' | 'Approved' | 'Rejected' | 'Withdrawn' | 'Expired'
  review_notes?: string
}

// ---------------------------------------------------------------------------
// Lease contracts
// ---------------------------------------------------------------------------
export type LeaseStatus = 'Active' | 'Expired' | 'Terminated' | 'Renewed' | 'Pending'

export interface LeaseContract {
  id: string
  property: PropertyBrief
  tenant: UserBrief
  landlord: UserBrief
  application_id: string | null
  lease_start_date: string
  lease_end_date: string
  monthly_rent: string
  currency_code: string
  security_deposit_amount: string | null
  payment_day_of_month: number
  rent_escalation_percent: string | null
  status: LeaseStatus
  termination_reason: string | null
  created_at: string
}

export interface CreateLeaseContractInput {
  property_id: number | string
  tenant_id: number | string
  application_id?: number | string
  lease_start_date: string
  lease_end_date: string
  monthly_rent: number
  currency_code?: string
  security_deposit_amount?: number
  payment_day_of_month?: number
  rent_escalation_percent?: number
}

export interface UpdateLeaseContractStatusInput {
  status: LeaseStatus
  termination_reason?: string
}

// ---------------------------------------------------------------------------
// Lease payments (manual tracking; Razorpay planned later)
// ---------------------------------------------------------------------------
export type LeasePaymentType =
  | 'Rent' | 'SecurityDeposit' | 'LateFee' | 'MaintenanceFee' | 'Refund' | 'Other'

export type LeasePaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded' | 'Partial'

export interface LeasePayment {
  id: string
  lease_id: string
  property: PropertyBrief | null
  payer: UserBrief
  payment_type: LeasePaymentType
  amount: string
  currency_code: string
  payment_method: string | null
  transaction_reference: string | null
  payment_date: string
  due_date: string | null
  status: LeasePaymentStatus
  notes: string | null
  created_at: string
}

export interface CreateLeasePaymentInput {
  lease_id: number | string
  payment_type: LeasePaymentType
  amount: number
  payment_method?: 'CreditCard' | 'BankTransfer' | 'Cash' | 'Cheque' | 'Digital'
  transaction_reference?: string
  payment_date: string
  due_date?: string
  notes?: string
}

export interface UpdateLeasePaymentStatusInput {
  status: LeasePaymentStatus
}

// ---------------------------------------------------------------------------
// Lease invoices
// ---------------------------------------------------------------------------
export interface LeaseInvoice {
  id: string
  lease_id: string
  invoice_number: string
  billing_period_start: string
  billing_period_end: string
  subtotal: string
  tax_amount: string
  total_amount: string
  currency_code: string
  due_date: string | null
  status: string
  created_at: string
}

export interface CreateLeaseInvoiceInput {
  lease_id: number | string
  billing_period_start: string
  billing_period_end: string
  subtotal: number
  tax_amount?: number
  due_date?: string
}
