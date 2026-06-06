'use client'

import { Court } from '@/types'
import SportsIcon from '@mui/icons-material/Sports'

interface CourtTabsProps {
  courts: Court[]
  selectedCourtId: string
  onChange: (courtId: string) => void
}

const sportEmoji: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  basketball: '🏀',
  badminton: '🏸',
  tennis: '🎾',
  volleyball: '🏐',
  other: '🏆',
}

export function CourtTabs({ courts, selectedCourtId, onChange }: CourtTabsProps) {
  if (courts.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {courts.map((court) => {
        const isSelected = court._id === selectedCourtId
        return (
          <button
            key={court._id}
            onClick={() => onChange(court._id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 border',
              isSelected
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50',
            ].join(' ')}
          >
            <span>{sportEmoji[court.sport] || '🏆'}</span>
            <span>{court.name}</span>
            <span className={`text-xs ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
              ₹{court.basePricePerSlot}/slot
            </span>
          </button>
        )
      })}
    </div>
  )
}
