'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { visitsApi, type RequestVisitInput, type UpdateVisitStatusInput } from '@repo/shared'

export function useVisits(role: 'visitor' | 'owner' = 'visitor') {
  return useQuery({
    queryKey: ['visits', role],
    queryFn: () => visitsApi.getVisits(role).then(res => res.data),
  })
}

export function useRequestVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RequestVisitInput) => visitsApi.requestVisit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', 'visitor'] })
    },
  })
}

export function useUpdateVisitStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string | number, data: UpdateVisitStatusInput }) => visitsApi.updateVisitStatus(visitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}
