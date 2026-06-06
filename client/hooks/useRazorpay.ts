'use client'

import { useState, useCallback } from 'react'
import { loadRazorpay, RazorpayOptions } from '@/lib/razorpay'
import toast from 'react-hot-toast'

interface UseRazorpayReturn {
  isLoading: boolean
  openPaymentModal: (options: RazorpayOptions) => Promise<void>
}

export function useRazorpay(): UseRazorpayReturn {
  const [isLoading, setIsLoading] = useState(false)

  const openPaymentModal = useCallback(async (options: RazorpayOptions) => {
    setIsLoading(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) {
        toast.error('Failed to load payment gateway. Please check your connection.')
        return
      }

      const rzp = new window.Razorpay({
        ...options,
        theme: {
          color: '#16a34a',
          ...options.theme,
        },
      })

      rzp.open()
    } catch (error) {
      console.error('Razorpay error:', error)
      toast.error('Payment initialization failed.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, openPaymentModal }
}
