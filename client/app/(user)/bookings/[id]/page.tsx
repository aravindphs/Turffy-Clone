'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import ChatIcon from '@mui/icons-material/Chat'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { bookingApi } from '@/lib/api'
import { BookingDetail } from '@/components/booking/BookingDetail'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageSpinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [chatOpen, setChatOpen] = useState(false)
  const [cancelDialog, setCancelDialog] = useState(false)

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await bookingApi.getById(id)
      return res.data.data
    },
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id),
    onSuccess: () => {
      toast.success('Booking cancelled successfully.')
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      setCancelDialog(false)
    },
    onError: () => toast.error('Failed to cancel booking.'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-slate-900">Booking not found</p>
          <button onClick={() => router.back()} className="mt-4 text-brand-600">← Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowBackIcon fontSize="small" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Booking Details</h1>
            <p className="text-sm text-slate-500">#{id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Booking Detail (left) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <BookingDetail
                booking={bookingData}
                onCancel={() => setCancelDialog(true)}
                isCancelling={cancelMutation.isPending}
              />
            </div>

            {/* Chat Toggle (mobile) */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium hover:border-brand-300 transition-colors"
            >
              <ChatIcon className="text-brand-600" />
              {chatOpen ? 'Hide Chat' : 'Chat with Owner'}
            </button>
          </div>

          {/* Chat Window (right) */}
          <div className={`lg:col-span-2 ${chatOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="h-[500px]">
              <ChatWindow bookingId={id} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelDialog}
        onClose={() => setCancelDialog(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action may be subject to a cancellation fee."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        isLoading={cancelMutation.isPending}
      />

      <Footer />
    </div>
  )
}
