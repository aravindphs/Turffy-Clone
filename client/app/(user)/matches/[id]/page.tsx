'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { matchApi } from '@/lib/api'
import { OpenMatch, OpenMatchPlayer, User, Court, Turf } from '@/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/store/auth.store'

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  basketball: '🏀',
  tennis: '🎾',
  volleyball: '🏐',
  other: '🏅',
}

function getUserId(user: User | string): string {
  if (typeof user === 'string') return user
  return user._id
}

function getUserName(user: User | string): string {
  if (typeof user === 'string') return 'Player'
  return (user as User).name || 'Player'
}

function getUserAvatar(user: User | string): string | null {
  if (typeof user === 'string') return null
  return (user as User).avatar || null
}

function getTurfName(turf: Turf | string): string {
  if (typeof turf === 'string') return 'Turf'
  return turf.name
}

function getTurfCity(turf: Turf | string, city: string): string {
  if (typeof turf === 'string') return city
  return turf.location?.city || city
}

function getCourtName(court: Court | string): string {
  if (typeof court === 'string') return 'Court'
  return court.name
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
  } catch {
    return dateStr
  }
}

function PlayerStatusBadge({ status }: { status: OpenMatchPlayer['status'] }) {
  switch (status) {
    case 'approved':
      return <Badge variant="green" size="sm" dot>Approved</Badge>
    case 'pending':
      return <Badge variant="yellow" size="sm" dot>Pending</Badge>
    case 'rejected':
      return <Badge variant="red" size="sm" dot>Rejected</Badge>
    default:
      return null
  }
}

function PlayerRow({
  player,
  isOrganizer,
  matchId,
  onRespond,
}: {
  player: OpenMatchPlayer
  isOrganizer: boolean
  matchId: string
  onRespond: (userId: string, status: 'approved' | 'rejected') => void
}) {
  const userId = getUserId(player.user)
  const name = getUserName(player.user)
  const avatar = getUserAvatar(player.user)

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-brand-600">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">
            Joined {new Date(player.joinedAt).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <PlayerStatusBadge status={player.status} />
        {isOrganizer && player.status === 'pending' && (
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onRespond(userId, 'approved')}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
              title="Approve"
            >
              <CheckCircleIcon fontSize="small" />
            </button>
            <button
              onClick={() => onRespond(userId, 'rejected')}
              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Reject"
            >
              <CancelIcon fontSize="small" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: match, isLoading } = useQuery<OpenMatch>({
    queryKey: ['match', id],
    queryFn: async () => {
      const res = await matchApi.getById(id)
      return res.data.data
    },
    enabled: !!id,
  })

  const joinMutation = useMutation({
    mutationFn: () => matchApi.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      showToast('Join request sent! Waiting for organizer approval.')
    },
    onError: () => showToast('Failed to join match. Please try again.', false),
  })

  const respondMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'approved' | 'rejected' }) =>
      matchApi.respondToJoin(id, userId, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      showToast(`Player ${vars.status === 'approved' ? 'approved' : 'rejected'}.`)
    },
    onError: () => showToast('Failed to update player status.', false),
  })

  const cancelMutation = useMutation({
    mutationFn: () => matchApi.cancel(id),
    onSuccess: () => {
      showToast('Match cancelled.')
      setTimeout(() => router.push('/matches'), 1500)
    },
    onError: () => showToast('Failed to cancel match.', false),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <PageSpinner />
    </div>
  )

  if (!match) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-semibold text-slate-900">Match not found</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-600 text-sm">
          ← Go back
        </button>
      </div>
    </div>
  )

  const organizerId = getUserId(match.organizer as User | string)
  const isOrganizer = user?._id === organizerId
  const alreadyInMatch = match.players.some((p) => getUserId(p.user as User | string) === user?._id)
  const canJoin = match.status === 'open' && !isOrganizer && !alreadyInMatch && !!user

  const approvedCount = match.maxPlayers - match.spotsLeft

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={[
            'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium',
            toast.ok
              ? 'bg-brand-600 text-white'
              : 'bg-red-600 text-white',
          ].join(' ')}
        >
          {toast.msg}
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          {/* Sport + status */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{SPORT_EMOJI[match.sport] || '🏅'}</span>
              <div>
                <p className="text-xl font-bold text-slate-900 capitalize">{match.sport} Match</p>
                <div className="mt-1">
                  {match.status === 'open' && <Badge variant="green" dot>Open</Badge>}
                  {match.status === 'full' && <Badge variant="yellow" dot>Full</Badge>}
                  {match.status === 'cancelled' && <Badge variant="red" dot>Cancelled</Badge>}
                  {match.status === 'completed' && <Badge variant="grey" dot>Completed</Badge>}
                </div>
              </div>
            </div>
            {isOrganizer && match.status === 'open' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this match?')) {
                    cancelMutation.mutate()
                  }
                }}
                isLoading={cancelMutation.isPending}
              >
                Cancel Match
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <LocationOnIcon className="text-brand-500 mt-0.5 shrink-0" fontSize="small" />
              <div>
                <span className="font-semibold">{getTurfName(match.turf)}</span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-slate-500">{getTurfCity(match.turf, match.city)}</span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-slate-500">{getCourtName(match.court)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CalendarTodayIcon className="text-slate-400 shrink-0" fontSize="small" />
              {formatDate(match.date)}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <AccessTimeIcon className="text-slate-400 shrink-0" fontSize="small" />
              {match.startTime} – {match.endTime}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <PeopleIcon className="text-slate-400 shrink-0" fontSize="small" />
              <span>
                {approvedCount}/{match.maxPlayers} players
                {match.spotsLeft > 0 && (
                  <span className="text-brand-600 ml-1.5">({match.spotsLeft} spot{match.spotsLeft !== 1 ? 's' : ''} left)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <HourglassEmptyIcon className="text-slate-400 shrink-0" fontSize="small" />
              Minimum {match.minPlayers} players needed to start
            </div>

            {match.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">Notes</p>
                <p className="text-sm text-slate-700">{match.notes}</p>
              </div>
            )}
          </div>

          {/* Join button */}
          {canJoin && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <Button
                className="w-full"
                onClick={() => joinMutation.mutate()}
                isLoading={joinMutation.isPending}
                disabled={match.status !== 'open'}
              >
                Request to Join Match
              </Button>
            </div>
          )}

          {!user && match.status === 'open' && (
            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                <a href="/login" className="text-brand-600 font-medium hover:underline">Sign in</a>
                {' '}to join this match
              </p>
            </div>
          )}
        </motion.div>

        {/* Players list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Players ({match.players.length})
          </h2>

          {match.players.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No players yet. Be the first to join!
            </p>
          ) : (
            <div>
              {/* Organizer */}
              <div className="flex items-center gap-3 py-3 border-b border-slate-100">
                <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
                  {getUserAvatar(match.organizer as User | string) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getUserAvatar(match.organizer as User | string)!}
                      alt={getUserName(match.organizer as User | string)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-brand-600">
                      {getUserName(match.organizer as User | string).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {getUserName(match.organizer as User | string)}
                    {isOrganizer && <span className="text-slate-400 text-xs ml-1">(you)</span>}
                  </p>
                </div>
                <Badge variant="blue" size="sm">Organizer</Badge>
              </div>

              {match.players.map((player, i) => (
                <PlayerRow
                  key={i}
                  player={player}
                  isOrganizer={isOrganizer}
                  matchId={id}
                  onRespond={(userId, status) => respondMutation.mutate({ userId, status })}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
