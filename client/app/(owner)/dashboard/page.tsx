'use client'

import { useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays } from 'date-fns'
import { motion } from 'framer-motion'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import StarIcon from '@mui/icons-material/Star'
import TodayIcon from '@mui/icons-material/Today'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import { statsApi, turfApi } from '@/lib/api'
import api from '@/lib/api'
import { StatsCard } from '@/components/owner/StatsCard'
import { RevenueChart } from '@/components/owner/RevenueChart'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { Booking, Court } from '@/types'
import Link from 'next/link'
import { CourtQRCode } from '@/components/turf/CourtQRCode'

function BookingRow({ booking }: { booking: Booking }) {
  const statusColors = {
    confirmed: 'green' as const,
    pending_payment: 'yellow' as const,
    cancelled: 'red' as const,
    completed: 'grey' as const,
    refunded: 'blue' as const,
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        #{booking._id.slice(-6).toUpperCase()}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {format(parseISO(booking.date), 'MMM d')} • {booking.slots[0]?.startTime}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">₹{booking.totalPrice}</td>
      <td className="px-4 py-3">
        <Badge variant={statusColors[booking.status]} size="sm">
          {booking.status.replace(/_/g, ' ')}
        </Badge>
      </td>
    </tr>
  )
}

interface DailyRevenue {
  date: string
  revenue: number
  bookings: number
}

export default function OwnerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner-stats'],
    queryFn: async () => {
      const res = await statsApi.ownerStats()
      return res.data.data
    },
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: DailyRevenue[] }>('/turfs/my/analytics')
        return res.data.data
      } catch {
        // Fallback: generate mock structure with zeros for last 30 days
        return Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          revenue: 0,
          bookings: 0,
        }))
      }
    },
  })

  const { data: myTurf } = useQuery({
    queryKey: ['my-turf'],
    queryFn: async () => {
      const res = await turfApi.getMyTurf()
      return res.data.data.turf
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here&apos;s your turf overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Today's Bookings"
          value={stats?.todayBookings || 0}
          icon={<TodayIcon />}
          color="blue"
        />
        <StatsCard
          title="This Week's Revenue"
          value={stats?.weekRevenue || 0}
          prefix="₹"
          icon={<CurrencyRupeeIcon />}
          color="green"
        />
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={<BookOnlineIcon />}
          color="purple"
        />
        <StatsCard
          title="Average Rating"
          value={stats?.averageRating?.toFixed(1) || '—'}
          suffix="★"
          icon={<StarIcon />}
          color="orange"
        />
      </div>

      {/* Analytics Chart */}
      {analyticsData && analyticsData.length > 0 && (
        <div className="mb-8">
          <RevenueChart data={analyticsData} title="Revenue — Last 30 Days" />
        </div>
      )}

      {/* Court QR Codes */}
      {myTurf && myTurf.courts && myTurf.courts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <QrCode2Icon className="text-brand-600" />
            <h2 className="text-xl font-bold text-slate-900">Court QR Codes</h2>
            <span className="text-sm text-slate-500">— Print and display at court entrance</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTurf.courts.map((court: Court) => (
              <CourtQRCode
                key={court._id}
                turfId={myTurf._id}
                courtId={court._id}
                courtName={court.name}
                turfName={myTurf.name}
                sport={court.sport}
                variant="card"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            {(stats?.recentBookings || []).length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <BookOnlineIcon className="text-slate-300 text-4xl mb-2" />
                <p>No bookings yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Slot</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentBookings.slice(0, 8).map((b) => (
                    <BookingRow key={b._id} booking={b} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Bookings</h2>
          </div>
          {(stats?.upcomingBookings || []).length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <TodayIcon className="text-slate-300 text-4xl mb-2" />
              <p>No upcoming bookings.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {stats?.upcomingBookings.slice(0, 6).map((booking) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      #{booking._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(booking.date), 'EEE, MMM d')} • {booking.slots[0]?.startTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{booking.totalPrice}</p>
                    <Badge variant="green" size="sm">Confirmed</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
