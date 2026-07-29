import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react'
import { propertiesApi, communicationsApi } from '@repo/shared'

interface HostelRequestsTabProps {
  hostelList?: any[];
  refetchHostelList?: () => void;
}

export function HostelRequestsTab({ hostelList = [], refetchHostelList }: HostelRequestsTabProps) {
  const [hostelName, setHostelName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleAccept = async (id: number) => {
    setAcceptingId(id)
    setError('')
    try {
      await communicationsApi.acceptInquiry(id)
      if (refetchHostelList) refetchHostelList()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to accept inquiry.')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessData(null)
    
    try {
      const data = await propertiesApi.createHostelAdmin({
        hostel_name: hostelName,
        first_name: firstName,
        last_name: lastName,
        email: email
      })
      
      setSuccessData(data)
      setHostelName('')
      setFirstName('')
      setLastName('')
      setEmail('')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to create hostel admin.')
    } finally {
      setIsSubmitting(false)
      if (refetchHostelList) refetchHostelList()
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Hostel Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">Create new hostels and provision admin credentials for owners.</p>
      </div>

      {successData && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successData.message}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-sm text-sm font-mono text-slate-700 dark:text-slate-300">
            <p><strong>Email (Username):</strong> {successData.admin_credentials.email}</p>
            <p><strong>Password:</strong> {successData.admin_credentials.password}</p>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 italic">Please share these credentials with the hostel owner securely.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-4 rounded-2xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      {hostelList && hostelList.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Managed Hostels ({hostelList.length})
          </h3>
          <div className="space-y-3">
            {hostelList.map((hostel: any) => (
              <div key={hostel.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{hostel.title || "Unnamed Hostel"}</h4>
                  <p className="text-xs text-slate-500">
                    {hostel.city ? `${hostel.city} • ` : ''}
                    Admin: {hostel.admin?.email || 'N/A'} ({hostel.admin?.name || 'N/A'})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Beds: {hostel.total_bed_spaces || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Vacant: {hostel.vacant_beds || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-500" />
          Create New Hostel & Admin
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Hostel Name</label>
            <Input 
              required
              value={hostelName}
              onChange={(e) => setHostelName(e.target.value)}
              placeholder="e.g., The Grand Hostel"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Owner First Name</label>
              <Input 
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Owner Last Name</label>
              <Input 
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Owner Email</label>
            <Input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? 'Creating...' : 'Create Hostel & Generate Credentials'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
