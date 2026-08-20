'use client'

/**
 * LeasesTab — the main "Leases" dashboard tab.
 *
 * A landlord/tenant rental-lifecycle view with four sub-tabs:
 *   Applications → Contracts → Payments → Invoices.
 *
 * `isLandlord` gates the landlord-only actions (create contract, record payment,
 * generate invoice). A user can be both landlord and tenant, so the sub-tabs are
 * always shown and the backend enforces actual permissions.
 */
import React, { useState } from 'react'
import type { User, Property } from '@repo/shared'
import { FileText, FileSignature, Wallet, Receipt, type LucideIcon } from 'lucide-react'
import { ApplicationsPanel } from './ApplicationsPanel'
import { ContractsPanel } from './ContractsPanel'
import { PaymentsPanel } from './PaymentsPanel'
import { InvoicesPanel } from './InvoicesPanel'

interface Props {
  user: User
  userProperties: Property[]
}

type SubTab = 'applications' | 'contracts' | 'payments' | 'invoices'

const SUB_TABS: { id: SubTab; label: string; icon: LucideIcon }[] = [
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'contracts', label: 'Leases', icon: FileSignature },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
]

export function LeasesTab({ user, userProperties }: Props) {
  const [active, setActive] = useState<SubTab>('applications')

  // A "landlord" is anyone who owns at least one property (or staff/admin).
  const isLandlord =
    user.role === 'super_admin' ||
    user.role === 'employee' ||
    userProperties.length > 0

  return (
    <div className="space-y-6">
      {/* Sub-tab nav (pill style) */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              active === t.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active panel */}
      {active === 'applications' && <ApplicationsPanel />}
      {active === 'contracts' && <ContractsPanel userProperties={userProperties} isLandlord={isLandlord} />}
      {active === 'payments' && <PaymentsPanel />}
      {active === 'invoices' && <InvoicesPanel isLandlord={isLandlord} />}
    </div>
  )
}
