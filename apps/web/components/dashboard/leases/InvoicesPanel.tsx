'use client'

/**
 * InvoicesPanel — list lease invoices and (for landlords) generate new ones.
 */
import React, { useState } from 'react'
import { useLeaseInvoices, useLeaseContracts, useCreateLeaseInvoice } from '@/app/hooks/use-leases'
import { formatMoney, formatDate, StatusBadge, EmptyState, Banner, Field, TextInput, Select, Spinner } from '../shared'
import { Receipt, Plus } from 'lucide-react'

interface Props {
  isLandlord: boolean
}

export function InvoicesPanel({ isLandlord }: Props) {
  const { data, isLoading } = useLeaseInvoices()
  const { data: contractsData } = useLeaseContracts()
  const createInvoice = useCreateLeaseInvoice()

  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)

  const [leaseId, setLeaseId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [tax, setTax] = useState('')

  const invoices = data?.data ?? []
  const contracts = contractsData?.data ?? []

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    createInvoice.mutate({
      lease_id: leaseId,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      subtotal: Number(subtotal),
      tax_amount: tax ? Number(tax) : 0,
    }, {
      onSuccess: () => {
        setBanner({ kind: 'success', msg: 'Invoice generated.' })
        setShowForm(false)
        setLeaseId(''); setPeriodStart(''); setPeriodEnd(''); setSubtotal(''); setTax('')
      },
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to generate invoice.' }),
    })
  }

  return (
    <div className="space-y-5">
      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-semibold">{invoices.length} invoice{invoices.length === 1 ? '' : 's'}</p>
        {isLandlord && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Generate invoice'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/50 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Lease">
              <Select value={leaseId} onChange={(e) => setLeaseId(e.target.value)} required>
                <option value="">Select a lease…</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>{c.property?.title} — {c.tenant?.full_name || c.tenant?.email}</option>
                ))}
              </Select>
            </Field>
            <Field label="Billing period start">
              <TextInput type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
            </Field>
            <Field label="Billing period end">
              <TextInput type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
            </Field>
            <Field label="Subtotal (₹)">
              <TextInput type="number" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="15000" required />
            </Field>
            <Field label="Tax (₹, optional)">
              <TextInput type="number" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" />
            </Field>
          </div>
          <button
            type="submit"
            disabled={createInvoice.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
          >
            {createInvoice.isPending ? 'Generating…' : 'Generate invoice'}
          </button>
        </form>
      )}

      {isLoading ? (
        <Spinner />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="No invoices yet"
          subtitle={isLandlord ? 'Generate an invoice to bill a tenant.' : 'Invoices for your leases will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(inv.billing_period_start)} → {formatDate(inv.billing_period_end)}
                </p>
                <p className="text-[11px] text-slate-400">Due {formatDate(inv.due_date)}</p>
              </div>
              <span className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(inv.total_amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
