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
    return null
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
      <div className="p-6 rounded-2xl text-center space-y-3 animate-fade-in" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.12)' }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: '#10b981' }} />
        </div>
        <h4 className="font-extrabold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Visit Scheduled!</h4>
        <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          Your visit request for <span className="font-semibold" style={{ color: 'var(--primary)' }}>{date}</span> at{' '}
          <span className="font-semibold" style={{ color: 'var(--primary)' }}>{selectedTimeSlot}</span> has been submitted for owner confirmation.
        </p>
      </div>
    )
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const isGuest = !user || user.role === 'guest'
  const isSubmitDisabled = isPending || !date || !selectedTimeSlot

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          <CalendarIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          Schedule a Visit
        </h3>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          In-Person Tour
        </span>
      </div>

      {isGuest ? (
        <div className="p-5 rounded-2xl text-center space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
            Log in to schedule an in-person visit tour with the property owner.
          </p>
          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-white font-semibold text-xs rounded-xl py-2.5"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
          >
            Login or Register
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="visit-date" className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <CalendarIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              Select Date <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <Input
              id="visit-date"
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              required
              className="text-xs rounded-xl cursor-pointer"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              Select Available Time Slot <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedTimeSlot === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className="py-2 px-2.5 text-xs font-semibold rounded-xl border transition-all"
                    style={{
                      background: isSelected ? 'var(--primary)' : 'var(--surface-2)',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      boxShadow: isSelected ? '0 2px 8px rgba(13,148,136,0.3)' : 'none',
                    }}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="visit-notes" className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              Additional Notes (Optional)
            </label>
            <Textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., I would like to see double sharing rooms on ground floor..."
              className="h-20 resize-none text-xs rounded-xl leading-relaxed"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            aria-label="Request visit schedule"
            className={`w-full text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
              isSubmitDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
            }`}
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Submitting Schedule...' : 'Request Visit'}
          </Button>
        </div>
      )}
    </form>
  )
}
