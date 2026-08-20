import React, { useState } from 'react'
import { useConversations, useConversationMessages, useSendMessage } from '@/app/hooks/use-conversations'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/app/hooks/use-auth'
import { useChatSocket } from '@/app/hooks/use-chat-socket'

export function MessagesTab() {
  const { data: conversations, isLoading: isLoadingConv } = useConversations()
  const [activeConvId, setActiveConvId] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
      {/* Left side: Conversation List */}
      <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-800 pr-4 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">Conversations</h3>
        {isLoadingConv ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
          </div>
        ) : conversations?.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${activeConvId === conv.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{conv.other_user.full_name}</h4>
                      {conv.unread_count > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{conv.unread_count}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.last_message_preview || 'No messages'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Message Thread */}
      <div className="md:col-span-2 flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        {activeConvId ? (
          <MessageThread convId={activeConvId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}

function MessageThread({ convId }: { convId: number }) {
  const { user } = useAuth()
  const { data: messages, isLoading } = useConversationMessages(convId)
  const { mutate: sendMessage, isPending } = useSendMessage(convId)
  const { status: socketStatus } = useChatSocket(convId)
  const [newMessage, setNewMessage] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    sendMessage({ body: newMessage }, {
      onSuccess: () => setNewMessage('')
    })
  }

  return (
    <>
      {/* Live connection indicator — green when the WebSocket is open. */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${socketStatus === 'open' ? 'bg-emerald-500' : socketStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {socketStatus === 'open' ? 'Live' : socketStatus === 'connecting' ? 'Connecting…' : 'Offline'}
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages?.map((msg) => {
          const isMe = msg.sender.id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm">{msg.body}</p>
                <span className={`text-[10px] block mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSend} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={isPending || !newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  )
}
