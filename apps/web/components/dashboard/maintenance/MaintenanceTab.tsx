'use client'

/**
 * MaintenanceTab — the main "Maintenance" dashboard tab.
 *
 * Tenant raises repair requests; landlord tracks them to resolution. Two
 * sub-tabs: "My Requests" (what I filed) and "Received" (requests on my
 * properties). A user can be both tenant and landlord, so both sub-tabs are
 * always shown and the backend enforces the actual permissions.
 */
import React, { useState } from 'react'
import type { Property } from '@repo/shared'
import { ClipboardList, Inbox, type LucideIcon } from 'lucide-react'
import { RequestsPanel } from './RequestsPanel'

interface Props {
  userProperties: Property[]
}

type SubTab = 'reported' | 'received'

const SUB_TABS: { id: SubTab; label: string; icon: LucideIcon }[] = [
  { id: 'reported', label: 'My Requests', icon: ClipboardList },
  { id: 'received', label: 'Received', icon: Inbox },
]

export function MaintenanceTab({ userProperties }: Props) {
  const [active, setActive] = useState<SubTab>('reported')

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
      {active === 'reported' && <RequestsPanel type="reported" userProperties={userProperties} />}
      {active === 'received' && <RequestsPanel type="received" userProperties={userProperties} />}
    </div>
  )
}
