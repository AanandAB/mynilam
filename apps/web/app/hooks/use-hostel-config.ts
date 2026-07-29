'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hostelConfigApi, type UpdateHostelConfigInput } from '@repo/shared'

export function useHostelConfig(propertyId: string | number | undefined) {
  return useQuery({
    queryKey: ['hostel-config', propertyId],
    queryFn: () => hostelConfigApi.getConfig(propertyId!).then(res => res.data),
    enabled: !!propertyId,
  })
}

export function useUpdateHostelConfig(propertyId: string | number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateHostelConfigInput) => hostelConfigApi.updateConfig(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-config', propertyId] })
    },
  })
}
