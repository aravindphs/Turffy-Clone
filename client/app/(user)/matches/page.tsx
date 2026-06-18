'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import { matchApi } from '@/lib/api'
import { OpenMatchCard } from '@/components/matches/OpenMatchCard'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuthStore } from '@/store/auth.store'
import { SportType } from '@/types'

const SPORTS: { key: SportType | ''; label: string; emoji: string }[] = [
  { key: '', label: 'All Sports', emoji: '🏅' },
  { key: 'football', label: 'Football', emoji: '⚽' },
  { key: 'cricket', label: 'Cricket', emoji: '🏏' },
  { key: 'badminton', label: 'Badminton', emoji: '🏸' },
  { key: 'basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'tennis', label: 'Tennis', emoji: '🎾' },
  { key: 'volleyball', label: 'Volleyball', emoji: '🏐' },
]

const CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur', 'Tiruppur',
]

function MatchCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-slate-200 rounded-full" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-14 bg-slate-200 rounded-full" />
      </div>
      <div className="h-4 w-3/4 bg-slate-200 rounded" />
      <div className="h-3 w-1/2 bg-slate-200 rounded" />
      <div className="h-3 w-2/3 bg-slate-200 rounded" />
      <div className="flex items-center gap-2 pt-1">
        <div className="h-7 w-7 bg-slate-200 rounded-full" />
        <div className="h-7 w-7 bg-slate-200 rounded-full -ml-2" />
        <div className="h-3 w-20 bg-slate-200 rounded ml-1" />
      </div>
      <div className="h-9 w-full bg-slate-200 rounded-xl mt-2" />
    </div>
  )
}

function MatchesContent() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [sport, setSport] = useState<SportType | ''>((searchParams.get('sport') as SportType) || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const filters = {
    sport: sport || undefined,
    city: city || undefined,
    date: date || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['open-matches', filters],
    queryFn: async () => {
      const res = await matchApi.list(filters)
      return res.data
    },
  })

  const joinMutation = useMutation({
    mutationFn: (matchId: string) => matchApi.join(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-matches'] })
    },
  })

  const matches = data?.data || []

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Sport chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SPORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSport(sport === s.key ? '' : s.key)}
                className={[
                  'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  sport === s.key
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                ].join(' ')}
              >
                <span>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* City + Date row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* City dropdown */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fontSize="small" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 appearance-none cursor-pointer"
              >
                <option value="">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700"
            />

            {/* Clear */}
            {(city || sport) && (
              <button
                onClick={() => { setCity(''); setSport('') }}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Open Matches</h1>
          {!isLoading && (
            <p className="text-sm text-slate-500 mt-0.5">
              {matches.length} match{matches.length !== 1 ? 'es' : ''} found
            </p>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <span className="text-6xl">⚽</span>
            <p className="mt-4 text-lg font-semibold text-slate-700">No open matches found</p>
            <p className="text-sm text-slate-500 mt-1">Be the first to create one!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {matches.map((match, i) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <OpenMatchCard
                  match={match}
                  currentUserId={user?._id}
                  onJoin={(id) => joinMutation.mutate(id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function MatchesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      }
    >
      <MatchesContent />
    </Suspense>
  )
}
