import React from 'react'
import type { Property } from '@repo/shared'
import { Check, Sparkles, Building2 } from 'lucide-react'

interface HostelSummaryBannerProps {
  property: Property
}

export const HostelSummaryBanner: React.FC<HostelSummaryBannerProps> = ({ property }) => {
  const startingPrice = property.starting_price || property.price
  const formattedPrice = startingPrice.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  })

  const sharingOptions = property.available_sharing_types && property.available_sharing_types.length > 0
    ? property.available_sharing_types
    : ['Single', 'Double', 'Triple', 'Dormitory']

  const roomOptionsCount = property.room_options?.length || sharingOptions.length

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/50 shadow-xl relative overflow-hidden space-y-6">
      {/* Decorative Background Accents */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Flexible Room Sharing Options
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pricing Overview & Availability
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Select from multiple sharing configurations tailored for students and working professionals.
          </p>
        </div>

        {/* Pricing Callout Box */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl shrink-0 flex flex-col items-start md:items-end space-y-1 shadow-inner">
          <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
            Starts from
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-xs text-indigo-200 font-medium">/month</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1 pt-1">
            <Building2 className="w-3.5 h-3.5" />
            {roomOptionsCount} Room {roomOptionsCount === 1 ? 'Option' : 'Types'} Available
          </span>
        </div>
      </div>

      {/* Available Options Quick Checklist */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
        <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mr-2">
          Available Options:
        </span>
        {sharingOptions.map((option, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-indigo-950/70 border border-indigo-700/60 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-100 shadow-2xs"
          >
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{option}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
