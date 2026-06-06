'use client'

import { Slot, Court, Turf } from '@/types'
import { format } from 'date-fns'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SportsIcon from '@mui/icons-material/Sports'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import WhatshotIcon from '@mui/icons-material/Whatshot'

interface BookingSummaryProps {
  turf: Turf
  court: Court | null
  selectedDate: Date | null
  selectedSlots: Slot[]
  totalPrice: number
}

export function BookingSummary({
  turf,
  court,
  selectedDate,
  selectedSlots,
  totalPrice,
}: BookingSummaryProps) {
  if (!court || selectedSlots.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CalendarTodayIcon className="text-slate-300 text-4xl mb-2" />
        <p className="text-sm">Select a date and time slots to see your booking summary.</p>
      </div>
    )
  }

  const startTime = selectedSlots[0]?.startTime
  const endTime = selectedSlots[selectedSlots.length - 1]?.endTime
  const peakSlots = selectedSlots.filter((s) => s.isPeak)
  const regularSlots = selectedSlots.filter((s) => !s.isPeak)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900">Booking Summary</h3>

      <div className="space-y-3">
        {/* Turf Name */}
        <div className="flex items-start gap-2">
          <SportsIcon className="text-brand-500 mt-0.5" fontSize="small" />
          <div>
            <p className="text-xs text-slate-400">Turf</p>
            <p className="text-sm font-medium text-slate-900">{turf.name}</p>
            <p className="text-xs text-slate-500">{court.name} • {court.sport}</p>
          </div>
        </div>

        {/* Date */}
        {selectedDate && (
          <div className="flex items-start gap-2">
            <CalendarTodayIcon className="text-brand-500 mt-0.5" fontSize="small" />
            <div>
              <p className="text-xs text-slate-400">Date</p>
              <p className="text-sm font-medium text-slate-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
        )}

        {/* Time */}
        <div className="flex items-start gap-2">
          <AccessTimeIcon className="text-brand-500 mt-0.5" fontSize="small" />
          <div>
            <p className="text-xs text-slate-400">Time</p>
            <p className="text-sm font-medium text-slate-900">
              {startTime} – {endTime}
            </p>
            <p className="text-xs text-slate-500">
              {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} • {court.slotDurationMinutes * selectedSlots.length} min
            </p>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        {regularSlots.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              Regular ({regularSlots.length} × ₹{court.basePricePerSlot})
            </span>
            <span className="text-slate-900">₹{regularSlots.reduce((s, slot) => s + slot.price, 0)}</span>
          </div>
        )}
        {peakSlots.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 flex items-center gap-1">
              <WhatshotIcon style={{ fontSize: 14 }} className="text-orange-500" />
              Peak ({peakSlots.length} × ₹{peakSlots[0]?.price})
            </span>
            <span className="text-orange-600">₹{peakSlots.reduce((s, slot) => s + slot.price, 0)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2">
          <span className="text-slate-900">Total</span>
          <span className="text-brand-600 flex items-center gap-0.5">
            <CurrencyRupeeIcon fontSize="small" />
            {totalPrice}
          </span>
        </div>
      </div>

      {peakSlots.length > 0 && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
          <WhatshotIcon className="text-orange-500 flex-shrink-0" fontSize="small" />
          <p className="text-xs text-orange-700">
            Some of your selected slots are during peak hours and are priced higher.
          </p>
        </div>
      )}
    </div>
  )
}
