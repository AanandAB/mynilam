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
    <div className="p-6 sm:p-8 rounded-2xl relative overflow-hidden space-y-6" style={{ background: 'linear-gradient(135deg, #0f766e, #115e59, #134e4a)', border: '1px solid rgba(13,148,136,0.3)' }}>
      {/* Decorative Background Accents */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(13,148,136,0.15)' }} />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(214,154,50,0.1)' }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#D69A32' }} />
            Flexible Room Sharing Options
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pricing Overview & Availability
          </h2>
          <p className="text-xs sm:text-sm max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Select from multiple sharing configurations tailored for students and working professionals.
          </p>
        </div>

        <div className="backdrop-blur-md p-4 sm:p-5 rounded-2xl shrink-0 flex flex-col items-start md:items-end space-y-1" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Starts from
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formattedPrice}
            </span>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>/month</span>
          </div>
          <span className="text-[11px] font-semibold flex items-center gap-1 pt-1" style={{ color: '#10b981' }}>
            <Building2 className="w-3.5 h-3.5" />
            {roomOptionsCount} Room {roomOptionsCount === 1 ? 'Option' : 'Types'} Available
          </span>
        </div>
      </div>

      <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-xs font-extrabold uppercase tracking-wider mr-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Available Options:
        </span>
        {sharingOptions.map((option, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
          >
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981' }}>
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{option}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
