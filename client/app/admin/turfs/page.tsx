'use client'

import { useQuery } from '@tanstack/react-query'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { adminApi, turfApi } from '@/lib/api'
import { TurfApproval } from '@/components/admin/TurfApproval'
import { PageSpinner } from '@/components/ui/Spinner'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'

export default function AdminTurfsPage() {
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')

  const { data: pendingTurfs, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-turfs'],
    queryFn: async () => {
      const res = await adminApi.getPendingTurfs()
      return res.data.data
    },
  })

  const { data: allTurfsData, isLoading: allLoading } = useQuery({
    queryKey: ['all-turfs-admin'],
    queryFn: async () => {
      const res = await turfApi.getAll({ limit: 50 })
      return res.data.data
    },
    enabled: tab === 'approved',
  })

  const isLoading = tab === 'pending' ? pendingLoading : allLoading

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Turf Management</h1>
        <p className="text-slate-500 mt-1">Review and approve turf listings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
            tab === 'pending' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200',
          ].join(' ')}
        >
          <HourglassEmptyIcon fontSize="small" />
          Pending
          {(pendingTurfs?.length || 0) > 0 && (
            <span className="bg-white text-orange-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {pendingTurfs?.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('approved')}
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
            tab === 'approved' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200',
          ].join(' ')}
        >
          <CheckCircleIcon fontSize="small" />
          All Turfs
        </button>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : tab === 'pending' ? (
        (pendingTurfs?.length || 0) === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <CheckCircleIcon className="text-brand-400 text-5xl mb-2" />
            <p className="text-lg font-semibold text-slate-900">All caught up!</p>
            <p className="text-slate-500">No turfs pending approval.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingTurfs?.map((turf) => (
              <TurfApproval key={turf._id} turf={turf} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Turf</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">City</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Sports</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allTurfsData?.map((turf) => (
                <tr key={turf._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{turf.name}</td>
                  <td className="px-4 py-3 text-slate-600">{turf.location.city}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {turf.sports.slice(0, 2).map((s) => (
                        <Badge key={s} variant="blue" size="sm">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={turf.status === 'approved' ? 'green' : turf.status === 'pending' ? 'yellow' : 'red'}
                      size="sm"
                      dot
                    >
                      {turf.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {turf.averageRating > 0 ? turf.averageRating.toFixed(1) : '—'} ★
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
