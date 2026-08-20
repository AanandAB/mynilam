'use client'

/**
 * ContractsPanel — list lease contracts and (for landlords) create/terminate.
 */
import React, { useState } from 'react'
import { useLeaseContracts, useCreateLeaseContract, useUpdateLeaseContractStatus } from '@/app/hooks/use-leases'
import type { Property } from '@repo/shared'
import { formatMoney, formatDate, StatusBadge, EmptyState, Banner, Field, TextInput, Select, Spinner } from '../shared'
import { FileSignature, Plus, X, Clock, Building2 } from 'lucide-react'

interface Props {
  userProperties: Property[]
  isLandlord: boolean
}

export function ContractsPanel({ userProperties, isLandlord }: Props) {
  const { data, isLoading } = useLeaseContracts()
  const createContract = useCreateLeaseContract()
  const updateStatus = useUpdateLeaseContractStatus()

  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)

  // Create-contract form state
  const [propertyId, setPropertyId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [deposit, setDeposit] = useState('')

  const contracts = data?.data ?? []

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createContract.mutate({
      property_id: propertyId,
      tenant_id: tenantId,
      lease_start_date: startDate,
      lease_end_date: endDate,
      monthly_rent: Number(monthlyRent),
      security_deposit_amount: deposit ? Number(deposit) : undefined,
    }, {
      onSuccess: () => {
        setBanner({ kind: 'success', msg: 'Lease contract created.' })
        setShowForm(false)
        setPropertyId(''); setTenantId(''); setStartDate(''); setEndDate(''); setMonthlyRent(''); setDeposit('')
      },
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to create contract.' }),
    })
  }

  const handleTerminate = (id: string) => {
    setTerminatingId(id)
    updateStatus.mutate({ id, data: { status: 'Terminated' } }, {
      onSuccess: () => setBanner({ kind: 'success', msg: 'Lease terminated.' }),
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to terminate lease.' }),
      onSettled: () => setTerminatingId(null),
    })
  }

  return (
    <div className="space-y-5">
      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-semibold">{contracts.length} contract{contracts.length === 1 ? '' : 's'}</p>
        {isLandlord && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Create contract'}
          </button>
        )}
      </div>

      {/* Inline create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900/50 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Property">
              <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
                <option value="">Select a property…</option>
                {userProperties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tenant user ID">
              <TextInput type="number" value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="e.g. 12" required />
            </Field>
            <Field label="Lease start date">
              <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </Field>
            <Field label="Lease end date">
              <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </Field>
            <Field label="Monthly rent (₹)">
              <TextInput type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="15000" required />
            </Field>
            <Field label="Security deposit (₹, optional)">
              <TextInput type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="30000" />
            </Field>
          </div>
          <button
            type="submit"
            disabled={createContract.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
          >
            {createContract.isPending ? 'Creating…' : 'Create contract'}
          </button>
        </form>
      )}

      {isLoading ? (
        <Spinner />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="w-7 h-7" />}
          title="No leases yet"
          subtitle={isLandlord ? 'Create a contract to start tracking rent.' : 'Your active leases will appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{c.property?.title}</h4>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(c.lease_start_date)} → {formatDate(c.lease_end_date)} · {c.property?.city}
                </p>
                <p className="text-xs text-slate-500">
                  {c.tenant?.full_name || c.tenant?.email} pays {formatMoney(c.monthly_rent)}/mo
                </p>
              </div>
              {isLandlord && c.status === 'Active' && (
                <button
                  onClick={() => handleTerminate(c.id)}
                  disabled={terminatingId === c.id}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {terminatingId === c.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Terminate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
