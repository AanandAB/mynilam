'use client'

/**
 * useChatSocket — opens a WebSocket to a conversation and pushes incoming
 * messages into the React Query cache in real time.
 *
 * Messages are still SENT via the REST endpoint; this socket is the RECEIVE
 * path (see ChatConsumer in communications/consumers.py). The access token is
 * passed as a `?token=` query param because browsers can't set Authorization
 * headers on a WebSocket handshake.
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '@repo/shared'

function resolveWsBase(): string {
  // Derive the WebSocket host from the REST API URL
  // (http://localhost:8000/api -> ws://localhost:8000).
  let base = 'http://localhost:8000/api'
  try {
    base = (process as any).env?.NEXT_PUBLIC_API_URL || base
  } catch {
    // SSR / non-browser context — fall back to the localhost default.
  }
  return base.replace(/^http/, 'ws').replace(/\/api\/?$/, '')
}

export type ChatSocketStatus = 'connecting' | 'open' | 'closed'

export function useChatSocket(conversationId: string | number | null): { status: ChatSocketStatus } {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ChatSocketStatus>('closed')

  useEffect(() => {
    if (!conversationId) {
      setStatus('closed')
      return
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      setStatus('closed')
      return
    }

    const url = `${resolveWsBase()}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`
    setStatus('connecting')
    const socket = new WebSocket(url)

    socket.onopen = () => setStatus('open')
    socket.onclose = () => setStatus('closed')
    socket.onerror = () => setStatus('closed')

    socket.onmessage = (event) => {
      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      // Guard: must look like a chat message payload from the consumer.
      if (!data || data.id == null || typeof data.body !== 'string') return

      queryClient.setQueryData<Message[]>(
        ['conversations', conversationId, 'messages'],
        (prev = []) => {
          if (prev.some((m) => String(m.id) === String(data.id))) return prev
          return [...prev, data as Message]
        },
      )
      // Refresh the conversation list (last-message preview + unread badge).
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }

    return () => {
      socket.close()
    }
  }, [conversationId, queryClient])

  return { status }
}
