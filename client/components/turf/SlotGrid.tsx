'use client'

import { useState } from 'react'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { motion } from 'framer-motion'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import RefreshIcon from '@mui/icons-material/Refresh'
import WifiIcon from '@mui/icons-material/Wifi'
import { Court, Slot } from '@/types'
import { CourtTabs } from './CourtTabs'
import { SlotCell } from './SlotCell'
import { useTurfAvailability } from '@/hooks/useTurfAvailability'
import { Spinner } from '@/components/ui/Spinner'
import { useSocket } from '@/hooks/useSocket'

// ─── Time Group Helpers ────────────────────────────────────────────────────────

const TIME_GROUPS = [
  { key: 'morning' as const, label: 'Morning', emoji: '🌅' },
  { key: 'afternoon' as const, label: 'Afternoon', emoji: '☀️' },
  { key: 'evening' as const, label: 'Evening', emoji: '🌆' },
  { key: 'night' as const, label: 'Night', emoji: '🌙' },
]

function groupSlotsByTime(slots: Slot[]) {
  return {
    morning: slots.filter((s) => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 6 && h < 12
    }),
    afternoon: slots.filter((s) => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 12 && h < 17
    }),
    evening: slots.filter((s) => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 17 && h < 21
    }),
    night: slots.filter((s) => {
      const h = parseInt(s.startTime.split(':')[0])
      return h >= 21
    }),
  }
}

interface SlotGridProps {
  turfId: string
  courts: Court[]
  onSelectionChange?: (slots: Slot[], totalPrice: number) => void
  ownerMode?: boolean
  onOwnerSlotClick?: (slot: Slot) => void
}

// Date selector pills
function DateSelector({
  selectedDate,
  onChange,
}: {
  selectedDate: Date
  onChange: (date: Date) => void
}) {
  const today = startOfDay(new Date())
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {dates.map((date) => {
        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        return (
          <button
            key={date.toISOString()}
            onClick={() => onChange(date)}
            className={[
              'flex flex-col items-center px-3 py-2 rounded-xl text-sm border transition-all duration-150 min-w-[60px]',
              isSelected
                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300',
            ].join(' ')}
          >
            <span className="text-xs font-medium">
              {isToday ? 'Today' : format(date, 'EEE')}
            </span>
            <span className="text-lg font-bold leading-tight">{format(date, 'd')}</span>
            <span className={`text-xs ${isSelected ? 'text-brand-100' : 'text-slate-400'}`}>
              {format(date, 'MMM')}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Legend Component
function SlotLegend() {
  const items = [
    { color: 'bg-emerald-50 border-emerald-400', label: 'Available' },
    { color: 'bg-indigo-600 border-indigo-600', label: 'Selected' },
    { color: 'bg-red-50 border-red-200', label: 'Booked' },
    { color: 'bg-slate-200 border-slate-300', label: 'Blocked' },
    { color: 'bg-orange-50 border-orange-400', label: 'Peak Hour' },
  ]
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-4 w-4 rounded border ${item.color}`} />
          <span className="text-xs text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SlotGrid({
  turfId,
  courts,
  onSelectionChange,
  ownerMode = false,
  onOwnerSlotClick,
}: SlotGridProps) {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?._id || '')
  const { isConnected } = useSocket()

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { slots, isLoading, selectedSlots, toggleSlot, clearSelection, totalPrice } =
    useTurfAvailability({
      turfId,
      courtId: selectedCourtId,
      date: dateStr,
      enabled: !!selectedCourtId,
    })

  const handleSlotToggle = (slot: Slot) => {
    if (ownerMode && onOwnerSlotClick) {
      onOwnerSlotClick(slot)
      return
    }
    toggleSlot(slot)
    // Notify parent
    const newSelected = selectedSlots.some((s) => s.id === slot.id)
      ? selectedSlots.filter((s) => s.id !== slot.id)
      : [...selectedSlots, slot]
    onSelectionChange?.(newSelected, newSelected.reduce((sum, s) => sum + s.price, 0))
  }

  const handleCourtChange = (courtId: string) => {
    setSelectedCourtId(courtId)
    clearSelection()
    onSelectionChange?.([], 0)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    clearSelection()
    onSelectionChange?.([], 0)
  }

  if (courts.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl">
        No courts available for this turf.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarTodayIcon className="text-brand-600" fontSize="small" />
          <h3 className="font-semibold text-slate-900">Select Date & Time</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Real-time indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs text-slate-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {selectedSlots.length > 0 && (
            <button
              onClick={() => { clearSelection(); onSelectionChange?.([], 0) }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <RefreshIcon style={{ fontSize: 14 }} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <DateSelector selectedDate={selectedDate} onChange={handleDateChange} />

      {/* Court Tabs */}
      {courts.length > 1 && (
        <CourtTabs
          courts={courts}
          selectedCourtId={selectedCourtId}
          onChange={handleCourtChange}
        />
      )}

      {/* Legend */}
      <SlotLegend />

      {/* Slots Grid — grouped by time of day */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : slots.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl">
          <CalendarTodayIcon className="text-slate-300 text-4xl mb-2" />
          <p>No slots available for this date.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {TIME_GROUPS.map(({ key, label, emoji }) => {
            const groupSlots = groupSlotsByTime(slots)[key]
            if (groupSlots.length === 0) return null
            const availableCount = groupSlots.filter((s) => s.status === 'available').length
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <span className="text-lg">{emoji}</span>
                  <h4 className="font-semibold text-slate-700">{label}</h4>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    {availableCount} available
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-4">
                  {groupSlots.map((slot) => (
                    <SlotCell key={slot.id} slot={slot} onToggle={handleSlotToggle} />
                  ))}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Selection Summary (user mode) */}
      {!ownerMode && selectedSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-indigo-600">
                {selectedSlots.map((s) => s.startTime).join(', ')}
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-900">₹{totalPrice}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
