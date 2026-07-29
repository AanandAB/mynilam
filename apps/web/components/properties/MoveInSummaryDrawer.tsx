import React, { useState } from 'react'
import type { RoomOption, Property } from '@repo/shared'
import { Button } from '@/components/ui/button'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Phone,
  Info,
  Building2,
  Sparkles,
} from 'lucide-react'

interface MoveInSummaryDrawerProps {
  isOpen: boolean
  onClose: () => void
  roomOption: RoomOption | null
  property: Property
  onContactClick: () => void
}

export const MoveInSummaryDrawer: React.FC<MoveInSummaryDrawerProps> = ({
  isOpen,
  onClose,
  roomOption,
  property,
  onContactClick,
}) => {
  const [reserved, setReserved] = useState(false)

  if (!isOpen || !roomOption) return null

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR',
    })
  }

  const monthlyRent = roomOption.monthly_rate
  const securityDeposit = roomOption.security_deposit || Math.round(monthlyRent * 1.5)
  const maintenanceFee = 500
  const totalMoveIn = monthlyRent + securityDeposit + maintenanceFee

  const handleReserve = () => {
    setReserved(true)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-y-auto animate-slide-left">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
          <div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">
              Move-In Cost Breakdown
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {roomOption.sharing_label}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close summary drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Hostel Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>{property.title}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
              {property.address ? `${property.address}, ` : ''}{property.city}, {property.state}
            </p>
          </div>

          {/* Reserved Confirmation State */}
          {reserved ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-200">
                  Room Slot Reserved!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  Your interest for {roomOption.sharing_label} has been recorded. The hostel owner will contact you shortly regarding token confirmation.
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5"
              >
                Close Summary
              </Button>
            </div>
          ) : (
            <>
              {/* Itemized Pricing Breakdown Table */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Itemized Financial Breakdown
                </h4>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {/* Monthly Rent */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        Monthly Rent
                      </span>
                      <span className="text-[11px] text-slate-400">Recurring monthly charge</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(monthlyRent)}
                    </span>
                  </div>

                  {/* Refundable Security Deposit */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                        Refundable Security Deposit
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                          Refundable
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400">One-time payment upon check-in</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(securityDeposit)}
                    </span>
                  </div>

                  {/* Maintenance / Admission Fee */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        Admission & Maintenance Fee
                      </span>
                      <span className="text-[11px] text-slate-400">One-time onboarding cost</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(maintenanceFee)}
                    </span>
                  </div>

                  {/* Total Initial Move-In Amount */}
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center justify-between">
                    <div>
                      <span className="font-black text-indigo-900 dark:text-indigo-200 block text-sm">
                        Total Initial Move-In Amount
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        Total payable before keys handover
                      </span>
                    </div>
                    <span className="font-black text-xl text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(totalMoveIn)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees & Policy Badges */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No Hidden Brokerage Fees</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct connection with verified hostel management. Deposits are securely handled and fully refundable upon checkout according to agreement rules.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer CTAs */}
        {!reserved && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 sticky bottom-0 z-10 shadow-lg">
            <Button
              onClick={handleReserve}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/25 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Reserve Online</span>
            </Button>

            <Button
              onClick={() => {
                onClose()
                onContactClick()
              }}
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300"
            >
              <Phone className="w-4 h-4 text-indigo-500" />
              <span>Schedule Visit / Contact Manager</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
