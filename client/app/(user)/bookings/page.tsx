'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import { bookingApi } from '@/lib/api'
import { BookingCard } from '@/components/booking/BookingCard'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Spinner } from '@/components/ui/Spinner'
import { BookingStatus } from '@/types'

const TABS: { label: string; value: BookingStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Upcoming', value: 'confirmed' },
  { label: 'Pending', value: 'pending_payment' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: async () => {
      const res = await bookingApi.getMyBookings({ status: activeTab || undefined })
      return res.data
    },
  })

  const bookings = data?.data || []

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">Track and manage all your turf bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-slate-200"
          >
            <BookOnlineIcon className="text-slate-300 text-5xl mb-3" />
            <p className="text-lg font-semibold text-slate-900">No bookings found</p>
            <p className="text-slate-500 mt-1 text-sm">
              {activeTab ? 'No bookings with this status.' : 'You haven\'t made any bookings yet.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BookingCard booking={booking} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
