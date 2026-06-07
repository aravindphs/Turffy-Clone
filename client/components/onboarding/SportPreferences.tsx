'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball'
import SportsTennisIcon from '@mui/icons-material/SportsTennis'
import SportsCricketIcon from '@mui/icons-material/SportsCricket'
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball'

const SPORTS = [
  { key: 'football', label: 'Football', icon: SportsSoccerIcon },
  { key: 'cricket', label: 'Cricket', icon: SportsCricketIcon },
  { key: 'basketball', label: 'Basketball', icon: SportsBasketballIcon },
  { key: 'badminton', label: 'Badminton', icon: SportsTennisIcon },
  { key: 'tennis', label: 'Tennis', icon: SportsTennisIcon },
  { key: 'volleyball', label: 'Volleyball', icon: SportsVolleyballIcon },
]

interface SportPreferencesProps {
  onComplete: () => void
}

export function SportPreferences({ onComplete }: SportPreferencesProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleSport = (sport: string) => {
    setSelected((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    )
  }

  const handleContinue = () => {
    localStorage.setItem('turffy_sports', JSON.stringify(selected))
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem('turffy_sports', JSON.stringify([]))
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="h-14 w-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <SportsSoccerIcon className="text-brand-600" style={{ fontSize: 28 }} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">What sports do you play?</h2>
          <p className="text-sm text-slate-500 mt-1.5">
            We&apos;ll personalize your turf recommendations
          </p>
        </div>

        {/* Sports Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {SPORTS.map(({ key, label, icon: Icon }) => {
              const isSelected = selected.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleSport(key)}
                  className={[
                    'flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-150',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50',
                  ].join(' ')}
                >
                  <Icon style={{ fontSize: 26 }} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 text-sm font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Continue →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
