'use client'

import React, { useState } from 'react'
import { useRequestVisit } from '@/app/hooks/use-visits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Clock, CheckCircle2, FileText, Send } from 'lucide-react'

const TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
]

export function VisitRequestForm({ propertyId, ownerId }: { propertyId: string; ownerId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const { mutate: requestVisit, isPending, isSuccess } = useRequestVisit()

  const [date, setDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [notes, setNotes] = useState('')

  if (user?.id === ownerId) {
    return null // Don't show to owner
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role === 'guest') {
      router.push('/login')
      return
    }

    if (!date || !selectedTimeSlot) return

    requestVisit({
      property_id: propertyId,
      visit_date: date,
      visit_time: selectedTimeSlot,
      visitor_notes: notes,
    })
  }

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 text-center space-y-3 shadow-sm animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Visit Scheduled!</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          Your visit request for <span className="font-semibold text-emerald-700 dark:text-emerald-300">{date}</span> at{' '}
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">{selectedTimeSlot}</span> has been submitted for owner confirmation.
        </p>
      </div>
    )
  }

  // Get tomorrow's date as min date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const isGuest = !user || user.role === 'guest'
  const isSubmitDisabled = isPending || !date || !selectedTimeSlot

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          Schedule a Visit
        </h3>
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          In-Person Tour
        </span>
      </div>

      {isGuest ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl text-center space-y-3 border border-slate-100 dark:border-slate-700/60">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Log in to schedule an in-person visit tour with the property owner.
          </p>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl py-2.5 shadow-sm"
          >
            Login or Register
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select Date */}
          <div className="space-y-1.5">
            <label htmlFor="visit-date" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              Select Date <span className="text-red-500">*</span>
            </label>
            <Input
              id="visit-date"
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs rounded-xl cursor-pointer"
            />
          </div>

          {/* Select Time Slot Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Select Available Time Slot <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visitor Notes */}
          <div className="space-y-1.5">
            <label htmlFor="visit-notes" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Additional Notes (Optional)
            </label>
            <Textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., I would like to see double sharing rooms on ground floor..."
              className="h-20 resize-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs rounded-xl leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            aria-label="Request visit schedule"
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
              isSubmitDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:shadow-indigo-500/20'
            }`}
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Submitting Schedule...' : 'Request Visit'}
          </Button>
        </div>
      )}
    </form>
  )
}
