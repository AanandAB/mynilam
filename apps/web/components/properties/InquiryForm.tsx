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
}

export function InquiryForm({
  propertyId,
  ownerId,
  ownerName,
  ownerPhone,
  ownerEmail,
}: InquiryFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { mutate: createInquiry, isPending, isSuccess } = useCreateInquiry()

  const [message, setMessage] = useState('')
  const [showContact, setShowContact] = useState(false)

  if (user?.id === ownerId) {
    return null // Don't show inquiry form to the owner
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
      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 text-center space-y-3 shadow-sm animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Inquiry Sent Successfully!</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          The hostel owner has received your message. Exact location and contact details will be shared once accepted.
        </p>
      </div>
    )
  }

  const isGuest = !user || user.role === 'guest'
  const isSubmitDisabled = isPending || !message.trim()

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
      {/* 1. Hostel Owner Contact Section */}
      <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-lg shadow-2xs shrink-0 uppercase">
            {ownerName?.charAt(0) || 'O'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Hostel Owner
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {ownerName || 'Hostel Administrator'}
            </h4>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Owner</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {showContact ? (
            <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 animate-fade-in">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>{ownerPhone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center space-x-2 truncate">
                <Mail className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="truncate">{ownerEmail || 'owner@example.com'}</span>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => {
                if (isGuest) {
                  router.push('/login')
                  return
                }
                setShowContact(true)
              }}
              className="w-full flex items-center justify-center space-x-2 font-bold text-xs bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl py-2.5"
            >
              <Phone className="h-4 w-4" />
              <span>{isGuest ? 'Login to Reveal Contact' : 'Reveal Contact Number'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Message Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            Send Direct Message
          </h3>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Inquiry
          </span>
        </div>

        {isGuest ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-center space-y-3 border border-slate-100 dark:border-slate-700/60">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Log in to send a message directly to the hostel owner.
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
            {/* Message Field Only (No autofilled user badge, no phone input) */}
            <div className="space-y-1.5">
              <label
                htmlFor="inquiry-message"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Your Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I am interested in booking a room/bed at this hostel. Please share available move-in dates and details..."
                required
                className="h-28 resize-none bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs rounded-xl leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              aria-label="Submit property inquiry"
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
                isSubmitDisabled
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'hover:shadow-indigo-500/20'
              }`}
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
