'use client'

import { createContext, useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Notification } from '@/types'
import NotificationsIcon from '@mui/icons-material/Notifications'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  const { incrementNotifications } = useUIStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
      return
    }

    const s = getSocket()
    setSocket(s)

    const onConnect = () => {
      setIsConnected(true)
      // Join user-specific room
      s.emit('join:room', `user:${user._id}`)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onNotification = (notification: Notification) => {
      incrementNotifications()
      toast(notification.title, {
        icon: '🔔',
        duration: 5000,
      })
    }

    const onError = (err: Error) => {
      console.error('Socket error:', err)
    }

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('notification:new', onNotification)
    s.on('connect_error', onError)

    // If already connected
    if (s.connected) {
      setIsConnected(true)
      s.emit('join:room', `user:${user._id}`)
    }

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('notification:new', onNotification)
      s.off('connect_error', onError)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [isAuthenticated, user, incrementNotifications])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
