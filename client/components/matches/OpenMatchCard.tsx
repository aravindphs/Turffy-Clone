'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PeopleIcon from '@mui/icons-material/People'
import { OpenMatch, OpenMatchPlayer, User } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  basketball: '🏀',
  tennis: '🎾',
  volleyball: '🏐',
  other: '🏅',
}

interface OpenMatchCardProps {
  match: OpenMatch
  onJoin?: (matchId: string) => void
  currentUserId?: string
}

function getStatusBadge(status: OpenMatch['status']) {
  switch (status) {
    case 'open':
      return <Badge variant="green" dot>Open</Badge>
    case 'full':
      return <Badge variant="yellow" dot>Full</Badge>
    case 'cancelled':
      return <Badge variant="red" dot>Cancelled</Badge>
    case 'completed':
      return <Badge variant="grey" dot>Completed</Badge>
    default:
      return null
  }
}

function getUserId(user: User | string): string {
  if (typeof user === 'string') return user
  return user._id
}

function getUserAvatar(player: OpenMatchPlayer): string | null {
  if (typeof player.user === 'string') return null
  return (player.user as User).avatar || null
}

function getUserName(player: OpenMatchPlayer): string {
  if (typeof player.user === 'string') return 'Player'
  return (player.user as User).name || 'Player'
}

function getTurfName(match: OpenMatch): string {
  if (typeof match.turf === 'string') return 'Turf'
  return match.turf.name
}

function getTurfCity(match: OpenMatch): string {
  if (typeof match.turf === 'string') return match.city
  return match.turf.location?.city || match.city
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
  } catch {
    return dateStr
  }
}

export function OpenMatchCard({ match, onJoin, currentUserId }: OpenMatchCardProps) {
  const organizerId = getUserId(match.organizer as User | string)
  const isOrganizer = currentUserId === organizerId

  const approvedPlayers = match.players.filter((p) => p.status === 'approved')
  const filledSpots = match.maxPlayers - match.spotsLeft
  const canJoin =
    match.status === 'open' &&
    !isOrganizer &&
    !match.players.some((p) => getUserId(p.user as User | string) === currentUserId)

  const shownAvatars = approvedPlayers.slice(0, 3)
  const extraCount = approvedPlayers.length > 3 ? approvedPlayers.length - 3 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
    >
      {/* Card Top: sport badge + status */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{SPORT_EMOJI[match.sport] || '🏅'}</span>
          <span className="text-sm font-semibold text-slate-700 capitalize">{match.sport}</span>
        </div>
        {getStatusBadge(match.status)}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        {/* Turf + city */}
        <div className="flex items-start gap-1.5">
          <LocationOnIcon className="text-brand-500 mt-0.5 shrink-0" fontSize="small" />
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">{getTurfName(match)}</p>
            <p className="text-xs text-slate-500">{getTurfCity(match)}</p>
          </div>
        </div>

        {/* Date + time */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CalendarTodayIcon style={{ fontSize: 14 }} className="text-slate-400" />
            {formatDate(match.date)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <AccessTimeIcon style={{ fontSize: 14 }} className="text-slate-400" />
            {match.startTime}–{match.endTime}
          </div>
        </div>

        {/* Players strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Avatar strip */}
            {shownAvatars.length > 0 ? (
              <div className="flex -space-x-2">
                {shownAvatars.map((p, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-white bg-brand-100 flex items-center justify-center overflow-hidden shrink-0"
                    title={getUserName(p)}
                  >
                    {getUserAvatar(p) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getUserAvatar(p)!} alt={getUserName(p)} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-brand-600">
                        {getUserName(p).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-slate-500">+{extraCount}</span>
                  </div>
                )}
              </div>
            ) : (
              <PeopleIcon className="text-slate-300" fontSize="small" />
            )}
            <span className="text-xs text-slate-500">
              {filledSpots}/{match.maxPlayers} players
            </span>
          </div>

          {/* Spots left indicator */}
          {match.status === 'open' && match.spotsLeft > 0 && (
            <span className="text-xs font-medium text-brand-600">
              {match.spotsLeft} spot{match.spotsLeft !== 1 ? 's' : ''} left
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action */}
        <div className="pt-2 border-t border-slate-100">
          {isOrganizer ? (
            <Link href={`/matches/${match._id}`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                Manage Match
              </Button>
            </Link>
          ) : canJoin && onJoin ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onJoin(match._id)}
            >
              Join Match
            </Button>
          ) : (
            <Link href={`/matches/${match._id}`} className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={match.status === 'full' || match.status === 'cancelled'}
              >
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
