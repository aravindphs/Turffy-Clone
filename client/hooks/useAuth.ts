'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { disconnectSocket } from '@/lib/socket'
import { LoginPayload, RegisterPayload } from '@/types'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setUser, clearAuth } = useAuthStore()

  // Fetch current user
  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.getMe()
      setUser(res.data.data)
      return res.data.data
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Login
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (res) => {
      const user = res.data.data.user
      setUser(user)
      queryClient.setQueryData(['me'], user)
      toast.success(`Welcome back, ${user.name}!`)
      if (user.role === 'owner') router.push('/dashboard')
      else if (user.role === 'admin') router.push('/admin/dashboard')
      else router.push('/turfs')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Login failed. Please try again.')
    },
  })

  // Register
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (res) => {
      const user = res.data.data.user
      setUser(user)
      queryClient.setQueryData(['me'], user)
      toast.success(`Welcome to Turffy, ${user.name}!`)
      if (user.role === 'owner') router.push('/dashboard')
      else router.push('/turfs')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Registration failed. Please try again.')
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
      // Force logout even on error
      clearAuth()
      queryClient.clear()
      disconnectSocket()
      router.push('/login')
    },
  })

  // Google OAuth
  const googleLoginMutation = useMutation({
    mutationFn: (token: string) => authApi.googleAuth(token),
    onSuccess: (res) => {
      const user = res.data.data.user
      setUser(user)
      queryClient.setQueryData(['me'], user)
      toast.success(`Welcome, ${user.name}!`)
      if (user.role === 'owner') router.push('/dashboard')
      else if (user.role === 'admin') router.push('/admin/dashboard')
      else router.push('/turfs')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Google login failed.')
    },
  })

  // Forgot Password
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email.')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to send reset email.')
    },
  })

  return {
    user: meData,
    isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    googleLogin: googleLoginMutation.mutate,
    isGoogleLoggingIn: googleLoginMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingReset: forgotPasswordMutation.isPending,
  }
}
