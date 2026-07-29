import React from 'react'
import type { RoomOption, Property } from '@repo/shared'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bed,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wind,
  Bath,
  Utensils,
  Shield,
  ArrowRight,
  BellRing,
} from 'lucide-react'

interface RoomBreakdownSectionProps {
  property: Property
  onSelectRoomOption: (option: RoomOption) => void
}

export const RoomBreakdownSection: React.FC<RoomBreakdownSectionProps> = ({
  property,
  onSelectRoomOption,
}) => {
  const roomOptions = property.room_options && property.room_options.length > 0
    ? property.room_options
    : []

  if (roomOptions.length === 0) {
    return null
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    })
  }

  return (
    <Card className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bed className="w-5 h-5 text-indigo-500" />
            Room Types & Pricing Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose your preferred room configuration below to view detailed move-in costs.
          </p>
        </div>

        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50 self-start sm:self-auto">
          {roomOptions.length} Variations
        </span>
      </div>

      {/* Sequential Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roomOptions.map((option) => {
          const isFullyBooked = option.status === 'fully_booked' || option.vacant_beds === 0
          const isLastBed = option.status === 'last_beds' || option.vacant_beds === 1

          return (
            <div
              key={option.id}
              className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-5 relative overflow-hidden ${
                isFullyBooked
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-90'
                  : isLastBed
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row: Room Label & Status Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {option.sharing_label}
                    </h4>
                    
                    {/* Vacant Bed Counter Text */}
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Bed className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{option.vacant_beds} / {option.total_beds} Beds Vacant</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  {isFullyBooked ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1 shrink-0">
                      <XCircle className="w-3 h-3 text-slate-500" /> Fully Booked
                    </span>
                  ) : isLastBed ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900/60 flex items-center gap-1 shrink-0 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> 1 Bed Left!
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900/60 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {option.vacant_beds} Available
                    </span>
                  )}
                </div>

                {/* Monthly Rate Display */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Monthly Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatPrice(option.monthly_rate)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/mo</span>
                  </div>
                </div>

                {/* Feature & Inclusion Badges */}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {/* AC / Non-AC Badge */}
                  <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                    option.is_ac
                      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/60'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}>
                    <Wind className="w-3.5 h-3.5 text-blue-500" />
                    <span>{option.is_ac ? 'Air Conditioned' : 'Non-AC'}</span>
                  </span>

                  {/* Attached Bath Badge */}
                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900/60 flex items-center gap-1.5">
                    <Bath className="w-3.5 h-3.5 text-purple-500" />
                    <span>{option.has_attached_bathroom ? 'Attached Bath' : 'Common Bath'}</span>
                  </span>

                  {/* Deposit Badge */}
                  {option.security_deposit && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Deposit: {formatPrice(option.security_deposit)}</span>
                    </span>
                  )}

                  {/* Food Badge */}
                  <span className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                    option.food_included
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    <Utensils className="w-3.5 h-3.5 text-amber-500" />
                    <span>{option.food_included ? 'Mess Food Included' : 'Self Service'}</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isFullyBooked ? (
                  <Button
                    onClick={() => onSelectRoomOption(option)}
                    variant="outline"
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    <BellRing className="w-4 h-4 text-slate-500" />
                    <span>Join Waitlist / Notify Me</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectRoomOption(option)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all"
                  >
                    <span>Book Bed / View Breakdown</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
