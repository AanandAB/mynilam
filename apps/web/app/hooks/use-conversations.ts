'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { communicationsApi, type StartConversationInput, type SendMessageInput } from '@repo/shared'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => communicationsApi.getConversations().then(res => res.data),
  })
}

export function useConversationMessages(convId: string | number | undefined) {
  return useQuery({
    queryKey: ['conversations', convId, 'messages'],
    queryFn: () => communicationsApi.getConversationMessages(convId!).then(res => res.data),
    enabled: !!convId,
    // Real-time updates arrive via WebSocket (see use-chat-socket); no polling.
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StartConversationInput) => communicationsApi.startConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage(convId: string | number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessageInput) => communicationsApi.sendMessage(convId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', convId, 'messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
