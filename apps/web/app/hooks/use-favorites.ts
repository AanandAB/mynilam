'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communicationsApi } from '@repo/shared'

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => communicationsApi.getFavorites().then(res => res.data),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (propertyId: string | number) => communicationsApi.toggleFavorite(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
