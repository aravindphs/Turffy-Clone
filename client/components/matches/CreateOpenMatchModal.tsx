'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import GroupIcon from '@mui/icons-material/Group'
import NotesIcon from '@mui/icons-material/Notes'
import { matchApi } from '@/lib/api'
import { OpenMatch } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface CreateOpenMatchModalProps {
  bookingId: string
  sport: string
  turfName: string
  date: string
  startTime: string
  endTime: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (match: OpenMatch) => void
}

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  basketball: '🏀',
  tennis: '🎾',
  volleyball: '🏐',
  other: '🏅',
}

export function CreateOpenMatchModal({
  bookingId,
  sport,
  turfName,
  date,
  startTime,
  endTime,
  isOpen,
  onClose,
  onSuccess,
}: CreateOpenMatchModalProps) {
  const [maxPlayers, setMaxPlayers] = useState(10)
  const [minPlayers, setMinPlayers] = useState(6)
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      matchApi.create({
        bookingId,
        maxPlayers,
        minPlayers,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (res) => {
      const match = res.data.data
      setToast('Open match created! Players can now find and join your game.')
      setTimeout(() => {
        setToast(null)
        onSuccess(match)
      }, 2000)
    },
    onError: () => {
      setToast('Failed to create open match. Please try again.')
      setTimeout(() => setToast(null), 3000)
    },
  })

  const handleMaxChange = (val: number) => {
    const clamped = Math.min(22, Math.max(2, val))
    setMaxPlayers(clamped)
    if (minPlayers > clamped) setMinPlayers(clamped)
  }

  const handleMinChange = (val: number) => {
    const clamped = Math.min(maxPlayers, Math.max(2, val))
    setMinPlayers(clamped)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Open Match" size="md">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800 font-medium"
        >
          {toast}
        </motion.div>
      )}

      {/* Match summary header */}
      <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-2xl">{SPORT_EMOJI[sport] || '🏅'}</span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{turfName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {date} &bull; {startTime}–{endTime} &bull; <span className="capitalize">{sport}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Max players */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
            <GroupIcon fontSize="small" className="text-brand-500" />
            Max Players
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleMaxChange(maxPlayers - 1)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
            >
              −
            </button>
            <input
              type="number"
              min={2}
              max={22}
              value={maxPlayers}
              onChange={(e) => handleMaxChange(parseInt(e.target.value) || 2)}
              className="w-20 text-center h-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
            />
            <button
              type="button"
              onClick={() => handleMaxChange(maxPlayers + 1)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
            >
              +
            </button>
            <span className="text-xs text-slate-400">(max 22)</span>
          </div>
        </div>

        {/* Min players */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
            <GroupIcon fontSize="small" className="text-slate-400" />
            Min Players to Start
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleMinChange(minPlayers - 1)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
            >
              −
            </button>
            <input
              type="number"
              min={2}
              max={maxPlayers}
              value={minPlayers}
              onChange={(e) => handleMinChange(parseInt(e.target.value) || 2)}
              className="w-20 text-center h-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
            />
            <button
              type="button"
              onClick={() => handleMinChange(minPlayers + 1)}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center text-lg"
            >
              +
            </button>
            <span className="text-xs text-slate-400">(min 2)</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
            <NotesIcon fontSize="small" className="text-slate-400" />
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bring your own bibs. Mixed skill levels welcome."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-slate-700 placeholder:text-slate-400"
          />
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-800">
          <SportsSoccerIcon style={{ fontSize: 14 }} className="mr-1 text-blue-500" />
          Once created, other players can find and request to join your match. You can approve or reject requests.
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isPending}>
            Create Open Match
          </Button>
        </div>
      </form>
    </Modal>
  )
}
