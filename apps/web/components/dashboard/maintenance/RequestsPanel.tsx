'use client'

/**
 * RequestsPanel — the maintenance request list for a given scope.
 *   - `reported`: the user's own requests + a "Raise request" inline form.
 *   - `received`: requests on the user's properties + the landlord status
 *     workflow (Acknowledge → In Progress → On Hold → Complete).
 */
import React, { useState } from 'react'
import type { Property, MaintenanceStatus } from '@repo/shared'
import { useMaintenanceRequests, useUpdateMaintenanceRequestStatus } from '@/app/hooks/use-maintenance'
import { Banner, EmptyState, PriorityBadge, StatusBadge, formatDate, formatMoney, Spinner } from '../shared'
import { RaiseRequestForm } from './RaiseRequestForm'
import { Building2, Check, Clock, Pause, Play, PlusCircle, Wrench, X, type LucideIcon } from 'lucide-react'

interface Props {
  type: 'reported' | 'received'
  userProperties: Property[]
}

type ActionStatus = Exclude<MaintenanceStatus, 'Submitted'>

interface Action {
  label: string
  status: ActionStatus
  icon: LucideIcon
  primary?: boolean
  danger?: boolean
}

// Friendly labels for success messages (status codes read awkwardly verbatim).
const STATUS_LABEL: Record<ActionStatus, string> = {
  Acknowledged: 'acknowledged',
  InProgress: 'in progress',
  OnHold: 'on hold',
  Completed: 'completed',
  Cancelled: 'cancelled',
}

/**
 * The actions available for a request's current status.
 * The reporter view only offers "Cancel" while the request is still open;
 * the landlord view offers the full workflow ladder.
 */
function actionsFor(status: string, isReporterView: boolean): Action[] {
  if (isReporterView) {
    if (['Submitted', 'Acknowledged', 'InProgress', 'OnHold'].includes(status)) {
      return [{ label: 'Cancel', status: 'Cancelled', icon: X, danger: true }]
    }
    return []
  }
  switch (status) {
    case 'Submitted':
      return [
        { label: 'Acknowledge', status: 'Acknowledged', icon: Check, primary: true },
        { label: 'Cancel', status: 'Cancelled', icon: X, danger: true },
      ]
    case 'Acknowledged':
      return [
        { label: 'Start Work', status: 'InProgress', icon: Play, primary: true },
        { label: 'Complete', status: 'Completed', icon: Check },
        { label: 'Cancel', status: 'Cancelled', icon: X, danger: true },
      ]
    case 'InProgress':
      return [
        { label: 'On Hold', status: 'OnHold', icon: Pause },
        { label: 'Complete', status: 'Completed', icon: Check, primary: true },
        { label: 'Cancel', status: 'Cancelled', icon: X, danger: true },
      ]
    case 'OnHold':
      return [
        { label: 'Resume', status: 'InProgress', icon: Play, primary: true },
        { label: 'Complete', status: 'Completed', icon: Check },
        { label: 'Cancel', status: 'Cancelled', icon: X, danger: true },
      ]
    default:
      return []
  }
}

export function RequestsPanel({ type, userProperties }: Props) {
  const { data, isLoading } = useMaintenanceRequests(type)
  const updateStatus = useUpdateMaintenanceRequestStatus()

  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const requests = data?.data ?? []
  const isReporterView = type === 'reported'

  const advance = (id: string, status: ActionStatus) => {
    setBusyId(id)
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => setBanner({ kind: 'success', msg: `Request ${STATUS_LABEL[status]}.` }),
        onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to update request.' }),
        onSettled: () => setBusyId(null),
      },
    )
  }

  return (
    <div className="space-y-5">
      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      {isReporterView && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-98"
          >
            {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {showForm ? 'Close form' : 'Raise request'}
          </button>
        </div>
      )}

      {showForm && <RaiseRequestForm userProperties={userProperties} onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-7 h-7" />}
          title={isReporterView ? 'No requests yet' : 'No incoming requests'}
          subtitle={
            isReporterView
              ? 'Raise a request and it will show up here for your landlord to track.'
              : 'When tenants report issues on your properties, they appear here for you to resolve.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const actions = actionsFor(req.status, isReporterView)
            return (
              <div key={req.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-3 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{req.property?.title}</span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{req.category?.name}</span>
                  <PriorityBadge priority={req.priority} />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{req.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{req.description}</p>
                </div>

                {!isReporterView && req.reported_by && (
                  <p className="text-xs text-slate-500">
                    Reported by <span className="font-semibold">{req.reported_by.full_name || req.reported_by.email}</span>
                  </p>
                )}

                {req.resolution_notes && (
                  <p className="text-xs italic text-slate-500 border-l-2 border-emerald-300 pl-2">“{req.resolution_notes}”</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reported</span>
                    <span className="font-semibold">{formatDate(req.created_at)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Scheduled</span>
                    <span className="font-semibold">{formatDate(req.scheduled_date)}</span>
                  </div>
                  {req.actual_cost != null && (
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Actual cost</span>
                      <span className="font-semibold">{formatMoney(req.actual_cost)}</span>
                    </div>
                  )}
                  {req.assigned_to && (
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Assigned to</span>
                      <span className="font-semibold truncate">{req.assigned_to.full_name || req.assigned_to.email}</span>
                    </div>
                  )}
                </div>

                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {actions.map((a) => (
                      <button
                        key={a.status}
                        onClick={() => advance(req.id, a.status)}
                        disabled={busyId === req.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-98 disabled:opacity-50 ${
                          a.danger
                            ? 'border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : a.primary
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {busyId === req.id ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <a.icon className="w-3.5 h-3.5" />}
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
