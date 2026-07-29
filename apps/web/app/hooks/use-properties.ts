'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertiesApi, type PropertyFilters } from '@repo/shared'

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', 'list', filters],
    queryFn: () => propertiesApi.getProperties(filters),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', 'detail', id],
    queryFn: () => propertiesApi.getProperty(id),
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: propertiesApi.createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: propertiesApi.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'list'] })
    },
  })
}