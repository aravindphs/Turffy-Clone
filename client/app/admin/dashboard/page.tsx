'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import PeopleIcon from '@mui/icons-material/People'
import GrassIcon from '@mui/icons-material/Grass'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import TodayIcon from '@mui/icons-material/Today'
import { statsApi } from '@/lib/api'
import { StatsCard } from '@/components/owner/StatsCard'
import { PageSpinner } from '@/components/ui/Spinner'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await statsApi.platformStats()
      return res.data.data
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform-wide overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Turfs"
          value={stats?.totalTurfs || 0}
          icon={<GrassIcon />}
          color="green"
        />
        <StatsCard
          title="Pending Approval"
          value={stats?.pendingTurfs || 0}
          icon={<HourglassEmptyIcon />}
          color="orange"
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={<PeopleIcon />}
          color="blue"
        />
        <StatsCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={<BookOnlineIcon />}
          color="purple"
        />
        <StatsCard
          title="Today's Bookings"
          value={stats?.todayBookings || 0}
          icon={<TodayIcon />}
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={`${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          prefix="₹"
          icon={<CurrencyRupeeIcon />}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'Pending Turf Reviews',
            value: stats?.pendingTurfs || 0,
            href: '/admin/turfs',
            color: 'border-orange-200 bg-orange-50',
            textColor: 'text-orange-700',
            desc: 'turfs awaiting approval',
          },
          {
            title: 'Total Owners',
            value: stats?.totalOwners || 0,
            href: '/admin/users',
            color: 'border-blue-200 bg-blue-50',
            textColor: 'text-blue-700',
            desc: 'registered turf owners',
          },
          {
            title: "Today's Revenue",
            value: `₹${(stats?.todayRevenue || 0).toLocaleString('en-IN')}`,
            href: '/admin/bookings',
            color: 'border-green-200 bg-green-50',
            textColor: 'text-green-700',
            desc: 'earned today',
          },
        ].map((item, i) => (
          <motion.a
            key={i}
            href={item.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`block p-5 rounded-2xl border ${item.color} hover:shadow-md transition-all`}
          >
            <p className="text-sm text-slate-500">{item.title}</p>
            <p className={`text-3xl font-extrabold ${item.textColor} mt-1`}>{item.value}</p>
            <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
