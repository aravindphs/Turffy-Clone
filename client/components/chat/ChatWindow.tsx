'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import SendIcon from '@mui/icons-material/Send'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useSocket } from '@/hooks/useSocket'
import { Message, User } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { joinRoom, leaveRoom } from '@/lib/socket'

interface ChatWindowProps {
  bookingId: string
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const sender = message.sender as User
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar
          src={typeof sender === 'object' ? sender.avatar : undefined}
          alt={typeof sender === 'object' ? sender.name : 'User'}
          size="xs"
          className="flex-shrink-0 mb-1"
        />
      )}
      <div
        className={[
          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-brand-600 text-white rounded-br-md'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md',
        ].join(' ')}
      >
        <p className="leading-relaxed">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-brand-100' : 'text-slate-400'} text-right`}>
          {format(parseISO(message.createdAt), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}

export function ChatWindow({ bookingId }: ChatWindowProps) {
  const { user } = useAuthStore()
  const { socket } = useSocket()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', bookingId],
    queryFn: async () => {
      const res = await chatApi.getMessages(bookingId)
      return res.data.data
    },
    enabled: !!bookingId,
    refetchInterval: false,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(bookingId, content),
    onSuccess: (res) => {
      queryClient.setQueryData(['chat', bookingId], (old: Message[] = []) => [
        ...old,
        res.data.data,
      ])
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Socket: join booking room, listen for new messages
  useEffect(() => {
    if (!socket || !bookingId) return

    const room = `booking:${bookingId}`
    joinRoom(room)

    const onNewMessage = (message: Message) => {
      queryClient.setQueryData(['chat', bookingId], (old: Message[] = []) => {
        // Avoid duplicates
        if (old.some((m) => m._id === message._id)) return old
        return [...old, message]
      })
    }

    const onTyping = ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?._id) setOtherTyping(typing)
    }

    socket.on('message:new', onNewMessage)
    socket.on('typing', onTyping)

    return () => {
      leaveRoom(room)
      socket.off('message:new', onNewMessage)
      socket.off('typing', onTyping)
    }
  }, [socket, bookingId, user?._id, queryClient])

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      socket?.emit('typing', { bookingId, userId: user?._id, isTyping: true })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket?.emit('typing', { bookingId, userId: user?._id, isTyping: false })
    }, 2000)
  }

  const handleSend = () => {
    const content = input.trim()
    if (!content) return
    setInput('')
    sendMutation.mutate(content)
    socket?.emit('typing', { bookingId, userId: user?._id, isTyping: false })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = []
  messages.forEach((msg) => {
    const date = format(parseISO(msg.createdAt), 'MMM d, yyyy')
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.messages.push(msg)
    else grouped.push({ date, messages: [msg] })
  })

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Chat with Turf Owner</h3>
        <p className="text-xs text-slate-400">Regarding your booking</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 flex-shrink-0">{group.date}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-2">
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={(msg.sender as User)._id === user?._id || msg.sender === user?._id}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {otherTyping && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 px-4 py-2 bg-white border border-slate-200 rounded-2xl rounded-bl-md">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping() }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 text-sm bg-slate-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>
    </div>
  )
}
