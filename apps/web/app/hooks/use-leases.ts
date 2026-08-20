'use client'

/**
 * React Query hooks for the leases domain.
 *
 * Pattern (matches use-properties / use-inquiries):
 * - `useQuery` hooks fetch and cache data under a namespaced key.
 * - `useMutation` hooks call the SDK and invalidate the `['leases']` group on
 *   success so lists refresh automatically.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  leasesApi,
  type CreateLeaseApplicationInput,
  type UpdateLeaseApplicationStatusInput,
  type CreateLeaseContractInput,
  type UpdateLeaseContractStatusInput,
  type CreateLeasePaymentInput,
  type UpdateLeasePaymentStatusInput,
  type CreateLeaseInvoiceInput,
} from '@repo/shared'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useLeaseApplications(type: 'sent' | 'received' = 'sent') {
  return useQuery({
    queryKey: ['leases', 'applications', type],
    queryFn: () => leasesApi.getApplications(type),
  })
}

export function useLeaseContracts() {
  return useQuery({
    queryKey: ['leases', 'contracts'],
    queryFn: () => leasesApi.getContracts(),
  })
}

export function useLeasePayments() {
  return useQuery({
    queryKey: ['leases', 'payments'],
    queryFn: () => leasesApi.getPayments(),
  })
}

export function useLeaseInvoices() {
  return useQuery({
    queryKey: ['leases', 'invoices'],
    queryFn: () => leasesApi.getInvoices(),
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function useInvalidateLeases() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['leases'] })
}

export function useCreateLeaseApplication() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: (data: CreateLeaseApplicationInput) => leasesApi.createApplication(data),
    onSuccess: invalidate,
  })
}

export function useUpdateLeaseApplicationStatus() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateLeaseApplicationStatusInput }) =>
      leasesApi.updateApplicationStatus(id, data),
    onSuccess: invalidate,
  })
}

export function useCreateLeaseContract() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: (data: CreateLeaseContractInput) => leasesApi.createContract(data),
    onSuccess: invalidate,
  })
}

export function useUpdateLeaseContractStatus() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateLeaseContractStatusInput }) =>
      leasesApi.updateContractStatus(id, data),
    onSuccess: invalidate,
  })
}

export function useCreateLeasePayment() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: (data: CreateLeasePaymentInput) => leasesApi.createPayment(data),
    onSuccess: invalidate,
  })
}

export function useUpdateLeasePaymentStatus() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateLeasePaymentStatusInput }) =>
      leasesApi.updatePaymentStatus(id, data),
    onSuccess: invalidate,
  })
}

export function useCreateLeaseInvoice() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: (data: CreateLeaseInvoiceInput) => leasesApi.createInvoice(data),
    onSuccess: invalidate,
  })
}
