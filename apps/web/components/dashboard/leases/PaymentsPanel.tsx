'use client'

/**
 * PaymentsPanel — manual lease payment ledger.
 * Landlord records a received payment (status "Completed"); tenant records a
 * payment they made (status "Pending"), which the landlord can then confirm.
 */
import React, { useState } from 'react'
import { useLeasePayments, useLeaseContracts, useCreateLeasePayment, useUpdateLeasePaymentStatus } from '@/app/hooks/use-leases'
import { formatMoney, formatDate, StatusBadge, EmptyState, Banner, Field, TextInput, Select, Spinner } from '../shared'
import { Wallet, Plus, Check, Clock } from 'lucide-react'

const PAYMENT_TYPES = ['Rent', 'SecurityDeposit', 'LateFee', 'MaintenanceFee', 'Refund', 'Other']
const PAYMENT_METHODS = ['Cash', 'BankTransfer', 'Cheque', 'Digital', 'CreditCard']

export function PaymentsPanel() {
  const { data, isLoading } = useLeasePayments()
  const { data: contractsData } = useLeaseContracts()
  const createPayment = useCreateLeasePayment()
  const updateStatus = useUpdateLeasePaymentStatus()

  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const [leaseId, setLeaseId] = useState('')
  const [paymentType, setPaymentType] = useState('Rent')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [notes, setNotes] = useState('')

  const payments = data?.data ?? []
  const contracts = contractsData?.data ?? []

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault()
    createPayment.mutate({
      lease_id: leaseId,
      payment_type: paymentType as any,
      amount: Number(amount),
      payment_method: method ? (method as any) : undefined,
      payment_date: paymentDate,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        setBanner({ kind: 'success', msg: 'Payment recorded.' })
        setShowForm(false)
        setLeaseId(''); setAmount(''); setMethod(''); setPaymentDate(''); setNotes('')
      },
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to record payment.' }),
    })
  }

  const handleConfirm = (id: string) => {
    setConfirmingId(id)
    updateStatus.mutate({ id, data: { status: 'Completed' } }, {
      onSuccess: () => setBanner({ kind: 'success', msg: 'Payment marked as completed.' }),
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to update payment.' }),
      onSettled: () => setConfirmingId(null),
    })
  }

  return (
    <div className="space-y-5">
      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-semibold">{payments.length} payment{payments.length === 1 ? '' : 's'}</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Record payment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRecord} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/50 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Lease">
              <Select value={leaseId} onChange={(e) => setLeaseId(e.target.value)} required>
                <option value="">Select a lease…</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.property?.title} — {c.tenant?.full_name || c.tenant?.email}</option>
                ))}
              </Select>
            </Field>
            <Field label="Payment type">
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Amount (₹)">
              <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000" required />
            </Field>
            <Field label="Payment method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">Select method…</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Payment date">
              <TextInput type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
            </Field>
            <Field label="Notes (optional)">
              <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. June rent" />
            </Field>
          </div>
          <button
            type="submit"
            disabled={createPayment.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
          >
            {createPayment.isPending ? 'Recording…' : 'Record payment'}
          </button>
        </form>
      )}

      {isLoading ? (
        <Spinner />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-7 h-7" />}
          title="No payments recorded"
          subtitle="Recorded rent and fee payments will appear here."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{p.payment_type}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-slate-500">{p.property?.title || 'Lease'} · {formatDate(p.payment_date)}</p>
                {p.payment_method && <p className="text-[11px] text-slate-400">via {p.payment_method}{p.transaction_reference ? ` · ${p.transaction_reference}` : ''}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(p.amount)}</span>
                {p.status === 'Pending' && (
                  <button
                    onClick={() => handleConfirm(p.id)}
                    disabled={confirmingId === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    {confirmingId === p.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Confirm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
