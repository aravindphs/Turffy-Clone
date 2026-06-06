'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import PaymentIcon from '@mui/icons-material/Payment'
import LockIcon from '@mui/icons-material/Lock'
import { Button } from '@/components/ui/Button'
import { useRazorpay } from '@/hooks/useRazorpay'
import { paymentApi, bookingApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Slot, Court, Turf } from '@/types'

interface PaymentButtonProps {
  turf: Turf
  court: Court
  date: string
  selectedSlots: Slot[]
  totalPrice: number
  onSuccess?: () => void
}

export function PaymentButton({
  turf,
  court,
  date,
  selectedSlots,
  totalPrice,
  onSuccess,
}: PaymentButtonProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { openPaymentModal, isLoading: isRazorpayLoading } = useRazorpay()
  const [isProcessing, setIsProcessing] = useState(false)

  const createBookingMutation = useMutation({
    mutationFn: () =>
      bookingApi.create({
        turfId: turf._id,
        courtId: court._id,
        date,
        slots: selectedSlots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
      }),
  })

  const verifyPaymentMutation = useMutation({
    mutationFn: paymentApi.verifyPayment,
    onSuccess: (res) => {
      toast.success('Payment successful! Booking confirmed.')
      router.push(`/bookings/${res.data.data._id}`)
      onSuccess?.()
    },
    onError: () => {
      toast.error('Payment verification failed. Please contact support.')
    },
  })

  const handlePay = async () => {
    if (!user) {
      toast.error('Please log in to book a turf.')
      router.push('/login')
      return
    }

    if (selectedSlots.length === 0) {
      toast.error('Please select at least one slot.')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create booking
      const bookingRes = await createBookingMutation.mutateAsync()
      const booking = bookingRes.data.data

      // 2. Create Razorpay order
      const orderRes = await paymentApi.createOrder(booking._id)
      const { orderId, amount, currency, keyId } = orderRes.data.data

      // 3. Open Razorpay modal
      await openPaymentModal({
        key: keyId,
        amount,
        currency,
        name: 'Turffy',
        description: `${turf.name} - ${court.name}`,
        order_id: orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        handler: async (response) => {
          await verifyPaymentMutation.mutateAsync({
            bookingId: booking._id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          })
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.')
            setIsProcessing(false)
          },
        },
        notes: {
          turf_id: turf._id,
          booking_id: booking._id,
        },
      })
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const isLoading = isProcessing || isRazorpayLoading || createBookingMutation.isPending

  return (
    <div className="space-y-3">
      <Button
        fullWidth
        size="lg"
        onClick={handlePay}
        isLoading={isLoading}
        disabled={selectedSlots.length === 0}
        leftIcon={<PaymentIcon fontSize="small" />}
      >
        {isLoading ? 'Processing...' : `Pay ₹${totalPrice}`}
      </Button>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <LockIcon style={{ fontSize: 12 }} />
        <span>Secured by Razorpay • UPI / Cards / NetBanking</span>
      </div>
    </div>
  )
}
