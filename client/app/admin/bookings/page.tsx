'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import { bookingApi } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { BookingStatus, Booking } from '@/types'

const statusVariant: Record<BookingStatus, 'green' | 'red' | 'yellow' | 'blue' | 'grey'> = {
  confirmed: 'green',
  pending_payment: 'yellow',
  cancelled: 'red',
  completed: 'grey',
  refunded: 'blue',
}

export default function AdminBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', status],
    queryFn: async () => {
      const res = await bookingApi.getAllBookings({ status: status || undefined, limit: 100 })
      return res.data
    },
  })

  const bookings = data?.data || []

  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">All Bookings</h1>
        <p className="text-slate-500 mt-1">
          {bookings.length} bookings • ₹{totalRevenue.toLocaleString('en-IN')} total revenue
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mb-6">
        {[
          { label: 'All', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending_payment' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value as BookingStatus | '')}
            className={[
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
              status === tab.value
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOnlineIcon className="text-slate-300 text-5xl mb-2" />
          <p className="text-slate-500">No bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Turf</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking: Booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      #{booking._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {typeof booking.turf === 'object' ? booking.turf.name : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {format(parseISO(booking.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ₹{booking.totalPrice}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[booking.status]} size="sm">
                        {booking.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
