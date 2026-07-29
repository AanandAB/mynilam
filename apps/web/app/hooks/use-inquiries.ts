'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communicationsApi, type CreateInquiryInput } from '@repo/shared'

export function useInquiries(type: 'sent' | 'received' = 'sent') {
  return useQuery({
    queryKey: ['inquiries', type],
    queryFn: () => communicationsApi.getInquiries(type).then(res => res.data),
  })
}

export function useCreateInquiry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInquiryInput) => communicationsApi.createInquiry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'sent'] })
    },
  })
}
