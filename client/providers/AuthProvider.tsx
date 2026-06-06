'use client'

import { useEffect } from 'react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        const res = await authApi.getMe()
        setUser(res.data.data)
      } catch {
        clearAuth()
      }
    }
    initAuth()
  }, [setUser, clearAuth, setLoading])

  return <>{children}</>
}
