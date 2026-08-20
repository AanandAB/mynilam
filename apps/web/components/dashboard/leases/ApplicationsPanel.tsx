'use client'

/**
 * ApplicationsPanel — tenant applies / landlord reviews lease applications.
 * Sub-toggle between "Sent" (my applications) and "Received" (applications on
 * my properties). Landlords can approve/reject from the Received view.
 */
import React, { useState } from 'react'
import { useLeaseApplications, useUpdateLeaseApplicationStatus } from '@/app/hooks/use-leases'
import { formatMoney, formatDate, StatusBadge, EmptyState, Banner, Spinner } from '../shared'
import { Building2, Inbox, Send, Check, X, Clock, FileText } from 'lucide-react'

export function ApplicationsPanel() {
  const [type, setType] = useState<'sent' | 'received'>('sent')
  const { data, isLoading } = useLeaseApplications(type)
  const updateStatus = useUpdateLeaseApplicationStatus()
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const applications = data?.data ?? []

  const handleReview = (id: string, status: 'Approved' | 'Rejected') => {
    setReviewingId(id)
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => setBanner({ kind: 'success', msg: `Application ${status.toLowerCase()}.` }),
      onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to update application.' }),
      onSettled: () => setReviewingId(null),
    })
  }

  const toggleCls = (active: boolean) =>
    `pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
      active
        ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
        : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
    }`

  return (
    <div className="space-y-5">
      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      {/* Sent / Received toggle */}
      <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button onClick={() => setType('sent')} className={toggleCls(type === 'sent')}>
          <Send className="w-4 h-4" />
          <span>Sent Applications</span>
        </button>
        <button onClick={() => setType('received')} className={toggleCls(type === 'received')}>
          <Inbox className="w-4 h-4" />
          <span>Received Applications</span>
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-7 h-7" />}
          title={type === 'sent' ? 'No applications yet' : 'No applications received'}
          subtitle={
            type === 'sent'
              ? 'Applications you submit for properties will appear here.'
              : 'When tenants apply to your properties, they show up here for review.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-3 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{app.property?.title}</span>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <p className="text-xs text-slate-500">{app.property?.city || '—'}</p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Move-in</span>
                  <span className="font-semibold">{formatDate(app.proposed_move_in_date)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Duration</span>
                  <span className="font-semibold">{app.proposed_lease_duration_months} mo</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Proposed rent</span>
                  <span className="font-semibold">{formatMoney(app.proposed_rent_amount)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    {type === 'received' ? 'Applicant' : 'Status'}
                  </span>
                  <span className="font-semibold truncate">
                    {type === 'received' ? app.applicant?.full_name || app.applicant?.email : app.status}
                  </span>
                </div>
              </div>

              {app.cover_letter && (
                <p className="text-xs italic text-slate-500 line-clamp-2">“{app.cover_letter}”</p>
              )}

              {type === 'received' && (app.status === 'Submitted' || app.status === 'UnderReview') && (
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleReview(app.id, 'Approved')}
                    disabled={reviewingId === app.id}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {reviewingId === app.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(app.id, 'Rejected')}
                    disabled={reviewingId === app.id}
                    className="flex-1 py-2 px-4 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
