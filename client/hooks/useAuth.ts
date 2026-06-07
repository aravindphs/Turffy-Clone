'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { disconnectSocket } from '@/lib/socket'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setUser, clearAuth } = useAuthStore()

  // Fetch current user on mount (used by layout/providers)
  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe()
      setUser(res.data.data)
      return res.data.data
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  // Google Sign-In
  const googleLoginMutation = useMutation({
    mutationFn: ({ credential, role }: { credential: string; role: 'user' | 'owner' }) =>
      authApi.googleAuth(credential, role),
    onSuccess: (res) => {
      const user = res.data.data.user
      setUser(user)
      queryClient.setQueryData(['me'], user)
      toast.success(`Welcome, ${user.name}! 🎉`)
      if (user.role === 'admin') router.push('/admin/dashboard')
      else if (user.role === 'owner') router.push('/dashboard')
      else router.push('/turfs')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Google sign-in failed. Please try again.')
    },
  })

  // Logout
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      disconnectSocket()
      toast.success('Logged out successfully')
      router.push('/login')
    },
    onError: () => {
      clearAuth()
      queryClient.clear()
      disconnectSocket()
      router.push('/login')
    },
  })

  return {
    user: meData,
    isLoading,
    googleLogin: googleLoginMutation.mutate,
    isGoogleLoggingIn: googleLoginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
