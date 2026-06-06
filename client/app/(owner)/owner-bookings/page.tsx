'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { bookingApi } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { BookingStatus } from '@/types'

const STATUS_TABS: { label: string; value: BookingStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending_payment' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const statusVariant: Record<BookingStatus, 'green' | 'red' | 'yellow' | 'blue' | 'grey'> = {
  confirmed: 'green',
  pending_payment: 'yellow',
  cancelled: 'red',
  completed: 'grey',
  refunded: 'blue',
}

export default function OwnerBookingsPage() {
  const [activeStatus, setActiveStatus] = useState<BookingStatus | ''>('')
  const [dateFilter, setDateFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['owner-bookings', activeStatus, dateFilter],
    queryFn: async () => {
      const res = await bookingApi.getTurfBookings({
        status: activeStatus || undefined,
        date: dateFilter || undefined,
        limit: 50,
      })
      return res.data
    },
  })

  const bookings = data?.data || []

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
        <p className="text-slate-500 mt-1">All bookings for your turf</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={[
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeStatus === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CalendarTodayIcon fontSize="small" className="text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
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
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Booking ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Date & Slots</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Court</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        #{booking._id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{format(parseISO(booking.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-slate-400">
                        {booking.slots[0]?.startTime} – {booking.slots[booking.slots.length - 1]?.endTime}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {typeof booking.court === 'object' ? booking.court.name : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">₹{booking.totalPrice}</td>
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
