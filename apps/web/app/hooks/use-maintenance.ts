'use client'

/**
 * React Query hooks for the maintenance domain.
 *
 * Pattern (matches use-leases / use-properties):
 * - `useQuery` hooks fetch and cache data under a namespaced key.
 * - `useMutation` hooks call the SDK and invalidate the `['maintenance']` group
 *   on success so lists refresh automatically.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  maintenanceApi,
  type CreateMaintenanceRequestInput,
  type UpdateMaintenanceRequestStatusInput,
} from '@repo/shared'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useMaintenanceCategories() {
  return useQuery({
    queryKey: ['maintenance', 'categories'],
    queryFn: () => maintenanceApi.getCategories(),
  })
}

export function useMaintenanceRequests(type: 'reported' | 'received' = 'reported') {
  return useQuery({
    queryKey: ['maintenance', 'requests', type],
    queryFn: () => maintenanceApi.getRequests(type),
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useInvalidateMaintenance() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
}

export function useCreateMaintenanceRequest() {
  const invalidate = useInvalidateMaintenance()
  return useMutation({
    mutationFn: (data: CreateMaintenanceRequestInput) => maintenanceApi.createRequest(data),
    onSuccess: invalidate,
  })
}

export function useUpdateMaintenanceRequestStatus() {
  const invalidate = useInvalidateMaintenance()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateMaintenanceRequestStatusInput }) =>
      maintenanceApi.updateRequestStatus(id, data),
    onSuccess: invalidate,
  })
}
