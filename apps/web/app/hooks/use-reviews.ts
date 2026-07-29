'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communicationsApi, type CreateReviewInput } from '@repo/shared'

export function usePropertyReviews(propertyId: string | number | undefined) {
  return useQuery({
    queryKey: ['reviews', propertyId],
    queryFn: () => communicationsApi.getPropertyReviews(propertyId!).then(res => res.data),
    enabled: !!propertyId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReviewInput) => communicationsApi.createReview(data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.property_id] })
    },
  })
}
