'use client'

/**
 * Shared dashboard UI primitives + helpers — the SINGLE source of truth for all
 * dashboard tabs (leases, maintenance, and any future domains).
 *
 * This consolidates what was previously duplicated across `leases/shared.tsx`
 * and `maintenance/shared.tsx`. When you need a badge, card, spinner, empty
 * state, banner, or form field, import it from here instead of copy-pasting.
 */
import React from 'react'

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/** Format a decimal string/number as INR currency (₹1,23,456). */
export function formatMoney(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—'
  const n = typeof val === 'string' ? parseFloat(val) : val
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

/** Format an ISO date string as a locale-aware short date. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ---------------------------------------------------------------------------
// Badges (color-coded pills)
// ---------------------------------------------------------------------------

// Central tone palette — the single place badge colors are defined.
const TONE_CLASSES: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
  red: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60',
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60',
  gray: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

// Combined status → tone map across all domains (lease, maintenance, review,
// inquiry, payment, visit, property). Unknown statuses fall back to gray.
const STATUS_TONES: Record<string, string> = {
  // positive / green
  Approved: 'emerald', Active: 'emerald', Completed: 'emerald', Paid: 'emerald',
  Renewed: 'emerald', Published: 'emerald', Verified: 'emerald', Responded: 'emerald',
  Accepted: 'emerald', Confirmed: 'emerald',
  // in-progress / amber
  Submitted: 'amber', UnderReview: 'amber', Pending: 'amber', Draft: 'amber',
  Sent: 'amber', PartiallyPaid: 'amber', Partial: 'amber', OnHold: 'amber',
  Requested: 'amber',
  // info / blue
  Acknowledged: 'blue', InProgress: 'blue', Scheduled: 'blue',
  // negative / red
  Rejected: 'red', Failed: 'red', Cancelled: 'red', Terminated: 'red',
  Overdue: 'red', Expired: 'red', Removed: 'red', Flagged: 'red', NoShow: 'red',
  // neutral
  Closed: 'gray', Withdrawn: 'gray',
}

const PRIORITY_TONES: Record<string, string> = {
  Low: 'gray', Medium: 'blue', High: 'amber', Urgent: 'red',
}

/** Base colored pill — used by StatusBadge / PriorityBadge. */
function Pill({ label, tone }: { label: string; tone: string }) {
  const cls = TONE_CLASSES[tone] ?? TONE_CLASSES.gray
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {label}
    </span>
  )
}

/** Colored status pill (any domain status). */
export function StatusBadge({ status }: { status: string }) {
  return <Pill label={status} tone={STATUS_TONES[status] ?? 'gray'} />
}

/** Colored priority pill (Low / Medium / High / Urgent). */
export function PriorityBadge({ priority }: { priority: string }) {
  return <Pill label={priority} tone={PRIORITY_TONES[priority] ?? 'gray'} />
}

// ---------------------------------------------------------------------------
// Layout & feedback
// ---------------------------------------------------------------------------

/** Standard card container. Use `accent` for the indigo-bordered form variant;
 *  extend layout with `className` (e.g. `flex items-center justify-between`). */
export function Panel({
  children,
  className = '',
  accent = false,
}: {
  children: React.ReactNode
  className?: string
  accent?: boolean
}) {
  const border = accent
    ? 'border-indigo-200 dark:border-indigo-900/50'
    : 'border-slate-200 dark:border-slate-800'
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border ${border} ${className}`}>
      {children}
    </div>
  )
}

/** Centered loading spinner. */
export function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className="flex justify-center p-12">
      <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${className}`} />
    </div>
  )
}

/** Friendly empty state with an icon and copy. */
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{subtitle}</p>}
    </div>
  )
}

/** Inline success / error banner. */
export function Banner({ kind, children }: { kind: 'success' | 'error'; children: React.ReactNode }) {
  const cls = kind === 'success'
    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
  return <div className={`p-4 rounded-2xl border text-xs font-semibold ${cls}`}>{children}</div>
}

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all'

/** A labeled form field wrapper for inline create forms. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</span>
      {children}
    </label>
  )
}

/** Shared text/number/date input styling. */
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

/** Shared select styling. */
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

/** Shared textarea styling. */
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none ${props.className ?? ''}`} />
}
