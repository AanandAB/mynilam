'use client'

import React, { useState } from 'react'
import { useCreateInquiry } from '@/app/hooks/use-inquiries'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/app/hooks/use-auth'
import { useRouter } from 'next/navigation'
import {
  Mail,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Send,
} from 'lucide-react'

interface InquiryFormProps {
  propertyId: string
  ownerId: string
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
  showContactDetails?: boolean
}

export function InquiryForm({
  propertyId,
  ownerId,
  ownerName,
  ownerPhone,
  ownerEmail,
  showContactDetails = false,
}: InquiryFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { mutate: createInquiry, isPending, isSuccess } = useCreateInquiry()

  const [message, setMessage] = useState('')
  const [showContact, setShowContact] = useState(showContactDetails)

  if (user?.id === ownerId) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role === 'guest') {
      router.push('/login')
      return
    }
    if (!message.trim()) return

    createInquiry({
      property_id: propertyId,
      message,
      phone_number: user?.phone || '',
    })
  }

  if (isSuccess) {
    return (
      <div className="p-6 rounded-2xl text-center space-y-3 animate-fade-in" style={{ background: 'var(--primary-light)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(13,148,136,0.15)' }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: 'var(--primary)' }} />
        </div>
        <h4 className="font-extrabold text-lg" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Inquiry Sent Successfully!</h4>
        <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          The hostel owner has received your message. Exact location and contact details will be shared once accepted.
        </p>
      </div>
    )
  }

  const isGuest = !user || user.role === 'guest'
  const isSubmitDisabled = isPending || !message.trim()

  return (
    <div className="p-6 rounded-2xl space-y-6" style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
      {/* Host Owner Contact Section */}
      <div className="space-y-4 pb-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0 uppercase" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(13,148,136,0.2)' }}>
            {ownerName?.charAt(0) || 'O'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Property Owner
            </span>
            <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {ownerName || 'Property Administrator'}
            </h4>
            <div className="flex items-center space-x-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Owner</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {showContact ? (
            <div className="space-y-2.5 p-4 rounded-2xl text-xs font-semibold animate-fade-in" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                <span>{ownerPhone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center space-x-2 truncate">
                <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                <span className="truncate">{ownerEmail || 'owner@example.com'}</span>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (isGuest) { router.push('/login'); return }
                setShowContact(true)
              }}
              className="w-full flex items-center justify-center space-x-2 font-bold text-xs text-white rounded-xl py-2.5"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
            >
              <Phone className="h-4 w-4" />
              <span>{isGuest ? 'Login to Reveal Contact' : 'Reveal Contact Number'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Message Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Mail className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            Send Direct Message
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Inquiry
          </span>
        </div>

        {isGuest ? (
          <div className="p-4 rounded-2xl text-center space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              Log in to send a message directly to the property owner.
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
              <label htmlFor="inquiry-message" className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                Your Message <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I am interested in booking a room/bed. Please share available move-in dates and details..."
                required
                className="h-28 resize-none text-xs rounded-xl leading-relaxed"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitDisabled}
              aria-label="Submit property inquiry"
              className={`w-full text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
                isSubmitDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
              }`}
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}
            >
              <Send className="w-4 h-4" />
              {isPending ? 'Sending Message...' : 'Submit Inquiry'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
