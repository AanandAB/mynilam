import React, { useState } from 'react'
import { useInquiries } from '@/app/hooks/use-inquiries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Phone, Building2, Calendar, CheckCircle2, Clock, Inbox, Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export function InquiriesTab() {
  const [type, setType] = useState<'sent' | 'received'>('sent')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'closed'>('all')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<number | string | null>(null)

  const { data, isLoading } = useInquiries(type)
  const queryClient = useQueryClient()

  // Format ISO Date String using Intl.DateTimeFormat (Locale Aware)
  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return isoString
    }
  }

  // Filter list based on selected status sub-tab
  const filteredData = (data || []).filter((inquiry) => {
    const status = inquiry.status?.toLowerCase()
    if (statusFilter === 'all') return true
    if (statusFilter === 'pending') return status === 'pending' || status === 'responded'
    if (statusFilter === 'accepted') return status === 'accepted'
    if (statusFilter === 'closed') return status === 'closed'
    return true
  })

  const handleAcceptInquiry = async (inquiryId: number | string) => {
    setAcceptingId(inquiryId)
    try {
      const { communicationsApi } = await import('@repo/shared')
      await communicationsApi.acceptInquiry(inquiryId)
      
      setActionSuccess('Enquiry accepted! Updated status to Accepted/In Progress. Location unlocked for client.')
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      setTimeout(() => setActionSuccess(null), 5000)
    } catch (e: any) {
      alert(e?.message || 'Failed to accept inquiry')
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex space-x-6">
          <button
            onClick={() => setType('sent')}
            className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
              type === 'sent' 
                ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Sent Inquiries</span>
          </button>

          <button
            onClick={() => setType('received')}
            className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
              type === 'received' 
                ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Received Inquiries</span>
          </button>
        </div>

        {/* Status Filter Sub-Tabs for Received Inquiries */}
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'pending' as const, label: 'Received / Active' },
            { id: 'accepted' as const, label: 'Accepted / In Progress' },
            { id: 'closed' as const, label: 'History / Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No {statusFilter !== 'all' ? statusFilter : ''} {type} inquiries</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {type === 'sent' 
              ? 'Inquiries you send for properties will appear here.' 
              : 'Inquiries received for your properties will appear here once submitted by clients.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map((inquiry) => {
            const status = (inquiry.status || 'pending').toLowerCase()
            const senderName = inquiry.sender?.full_name || (inquiry.sender as any)?.name || inquiry.sender?.email || 'Client'
            const recipientName = inquiry.recipient?.full_name || (inquiry.recipient as any)?.name || inquiry.recipient?.email || 'Property Owner'
            const phone = inquiry.phone_number || (inquiry as any).phone
            const formattedDate = formatDate(inquiry.created_at)

            return (
              <Card key={inquiry.id} className="p-5 space-y-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Card Header: Property Title & Status Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {inquiry.property?.title || 'Hostel Property'}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      status === 'accepted'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                        : status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      {status === 'accepted' ? 'Accepted' : status === 'pending' ? 'Pending' : status}
                    </span>
                  </div>

                  {/* Message Quote */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/80 leading-relaxed italic">
                    "{inquiry.message}"
                  </div>

                  {/* Participant & Contact Info */}
                  <div className="flex flex-col space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {type === 'sent' ? `To: ${recipientName}` : `From: ${senderName}`}
                      </span>
                    </div>

                    {phone && (
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{phone}</span>
                      </div>
                    )}

                    {formattedDate && (
                      <div className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Received: {formattedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acceptance Workflow Action for Hostels/Owners */}
                {type === 'received' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    {status === 'pending' ? (
                      <button
                        type="button"
                        disabled={acceptingId === inquiry.id}
                        onClick={() => handleAcceptInquiry(inquiry.id)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50"
                      >
                        {acceptingId === inquiry.id ? (
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accept Enquiry (Unlock Location & Notify)</span>
                      </button>
                    ) : status === 'accepted' ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Accepted • In Progress (Location Unlocked)</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

