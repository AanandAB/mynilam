import React, { useState } from 'react'
import { useVisits, useUpdateVisitStatus } from '@/app/hooks/use-visits'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/app/hooks/use-auth'
import type { VisitStatus } from '@repo/shared'

export function VisitsTab() {
  const { user } = useAuth()
  const isOwner = user?.role === 'normal' || user?.role === 'hostel_admin' || user?.role === 'employee'
  
  const [role, setRole] = useState<'visitor' | 'owner'>(isOwner ? 'owner' : 'visitor')
  const { data: visits, isLoading } = useVisits(role)
  const { mutate: updateStatus } = useUpdateVisitStatus()

  const handleUpdateStatus = (id: number, status: VisitStatus) => {
    updateStatus({ visitId: id, data: { status } })
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setRole('visitor')}
            className={`pb-2 px-1 text-sm font-medium ${role === 'visitor' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Visits (As Visitor)
          </button>
          <button
            onClick={() => setRole('owner')}
            className={`pb-2 px-1 text-sm font-medium ${role === 'owner' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Requests (As Owner)
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : visits?.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No visits found</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Visit requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visits?.map((visit) => (
            <Card key={visit.id} className="p-5 space-y-4 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{visit.property.title}</h4>
                  <div className="flex items-center text-xs text-slate-500 space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{visit.property.city}, {visit.property.state}</span>
                  </div>
                </div>
                <Badge 
                  variant={visit.status === 'confirmed' ? 'default' : visit.status === 'cancelled' ? 'destructive' : 'secondary'}
                  className={visit.status === 'requested' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' : ''}
                >
                  {visit.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex space-x-6 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{visit.visit_date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>{visit.visit_time.substring(0, 5)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <UserIcon className="w-4 h-4" />
                <span>
                  {role === 'visitor' ? `Owner: ${visit.property.user?.full_name || 'N/A'}` : `Visitor: ${visit.visitor.full_name}`}
                </span>
              </div>

              {visit.visitor_notes && (
                <p className="text-xs text-slate-500 italic">Notes: "{visit.visitor_notes}"</p>
              )}

              {/* Actions */}
              {visit.status === 'requested' && (
                <div className="flex space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  {role === 'owner' ? (
                    <>
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(visit.id, 'confirmed')}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20" onClick={() => handleUpdateStatus(visit.id, 'cancelled')}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={() => handleUpdateStatus(visit.id, 'cancelled')}>
                      Cancel Request
                    </Button>
                  )}
                </div>
              )}
              
              {role === 'owner' && visit.status === 'confirmed' && (
                <div className="flex space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleUpdateStatus(visit.id, 'completed')}>
                    Mark Completed
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-amber-600" onClick={() => handleUpdateStatus(visit.id, 'no_show')}>
                    No Show
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
