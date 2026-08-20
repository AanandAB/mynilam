'use client'

/**
 * RaiseRequestForm — inline form to file a maintenance request.
 *
 * Property options merge the user's OWNED properties with the properties they
 * LEASE (from their lease contracts), so a tenant can pick the place they rent
 * and a landlord can pick a place they own. The backend auto-links the active
 * lease when the reporter is a tenant, so no `lease_id` needs to be sent.
 */
import React, { useMemo, useState } from 'react'
import type { Property, MaintenancePriority } from '@repo/shared'
import { useLeaseContracts } from '@/app/hooks/use-leases'
import { useCreateMaintenanceRequest, useMaintenanceCategories } from '@/app/hooks/use-maintenance'
import { Banner, Field, Select, TextInput, TextArea } from '../shared'
import { Wrench, X } from 'lucide-react'

interface Props {
  userProperties: Property[]
  onClose: () => void
}

interface PropertyOption {
  id: string
  title: string
}

export function RaiseRequestForm({ userProperties, onClose }: Props) {
  const { data: categoriesData } = useMaintenanceCategories()
  const { data: contractsData } = useLeaseContracts()
  const createRequest = useCreateMaintenanceRequest()

  const [propertyId, setPropertyId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<MaintenancePriority>('Medium')
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const categories = categoriesData?.data ?? []
  const contracts = contractsData?.data ?? []

  // Owned + leased properties merged and de-duplicated by id (a tenant may both
  // own and lease, and the same property can appear in both lists).
  const propertyOptions = useMemo<PropertyOption[]>(() => {
    const map = new Map<string, string>()
    userProperties.forEach((p) => map.set(String(p.id), p.title))
    contracts.forEach((c) => {
      if (c.property) map.set(c.property.id, c.property.title)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [userProperties, contracts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !categoryId || !title.trim() || !description.trim()) {
      setBanner({ kind: 'error', msg: 'Please fill in all required fields.' })
      return
    }

    setSubmitting(true)
    createRequest.mutate(
      {
        property_id: propertyId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        priority,
      },
      {
        onSuccess: () => {
          setBanner({ kind: 'success', msg: 'Request raised successfully.' })
          setPropertyId('')
          setCategoryId('')
          setTitle('')
          setDescription('')
          setPriority('Medium')
          onClose()
        },
        onError: (e: any) => setBanner({ kind: 'error', msg: e?.message || 'Failed to raise request.' }),
        onSettled: () => setSubmitting(false),
      },
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-500" />
          Raise a maintenance request
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      {banner && <Banner kind={banner.kind}>{banner.msg}</Banner>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Property">
            <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">Select property…</option>
              {propertyOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaky kitchen tap" />
        </Field>

        <Field label="Description">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the issue — what, where, since when…"
          />
        </Field>

        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as MaintenancePriority)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </Select>
        </Field>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit request'
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
