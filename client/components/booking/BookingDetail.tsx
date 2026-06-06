'use client'

import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { Booking, Turf, Court, User, BookingStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SportsIcon from '@mui/icons-material/Sports'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import PersonIcon from '@mui/icons-material/Person'

const statusConfig: Record<BookingStatus, { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'grey' }> = {
  pending_payment: { label: 'Payment Pending', variant: 'yellow' },
  confirmed: { label: 'Confirmed', variant: 'green' },
  cancelled: { label: 'Cancelled', variant: 'red' },
  completed: { label: 'Completed', variant: 'grey' },
  refunded: { label: 'Refunded', variant: 'blue' },
}

interface BookingDetailProps {
  booking: Booking
  onCancel?: () => void
  isCancelling?: boolean
}

export function BookingDetail({ booking, onCancel, isCancelling }: BookingDetailProps) {
  const turf = booking.turf as Turf
  const court = booking.court as Court
  const user = booking.user as User
  const statusInfo = statusConfig[booking.status]

  const startTime = booking.slots[0]?.startTime
  const endTime = booking.slots[booking.slots.length - 1]?.endTime
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending_payment'

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        booking.status === 'confirmed'
          ? 'bg-emerald-50 border-emerald-200'
          : booking.status === 'cancelled'
          ? 'bg-red-50 border-red-200'
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <p className="text-sm text-slate-500">Booking Status</p>
          <Badge variant={statusInfo.variant} size="md">
            {statusInfo.label}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Booking ID</p>
          <p className="text-sm font-mono font-medium text-slate-600">
            #{booking._id.slice(-8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Turf Info */}
      <div className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0">
          {turf.images?.[0] ? (
            <Image src={turf.images[0]} alt={turf.name} fill className="object-cover" />
          ) : (
            <div className="h-full bg-slate-200 flex items-center justify-center text-2xl">🏟️</div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{turf.name}</h3>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <LocationOnIcon fontSize="small" className="text-brand-500" />
            {turf.location?.address}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <SportsIcon fontSize="small" className="text-slate-400" />
            {court.name} • {court.sport}
          </div>
        </div>
      </div>

      {/* Booking Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CalendarTodayIcon fontSize="small" className="text-brand-500" />
            <p className="text-xs text-slate-400">Date</p>
          </div>
          <p className="font-semibold text-slate-900">
            {format(parseISO(booking.date), 'EEE, MMM d')}
          </p>
          <p className="text-sm text-slate-500">{format(parseISO(booking.date), 'yyyy')}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <AccessTimeIcon fontSize="small" className="text-brand-500" />
            <p className="text-xs text-slate-400">Time</p>
          </div>
          <p className="font-semibold text-slate-900">{startTime} – {endTime}</p>
          <p className="text-sm text-slate-500">{booking.slots.length} slot(s)</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <CurrencyRupeeIcon fontSize="small" className="text-brand-500" />
            <p className="text-xs text-slate-400">Amount Paid</p>
          </div>
          <p className="font-bold text-xl text-slate-900">₹{booking.totalPrice}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <PersonIcon fontSize="small" className="text-brand-500" />
            <p className="text-xs text-slate-400">Booked By</p>
          </div>
          <p className="font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Slot Timeline */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Booked Slots</h4>
        <div className="flex flex-wrap gap-2">
          {booking.slots.map((slot, i) => (
            <span
              key={i}
              className="px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg text-sm font-medium"
            >
              {slot.startTime} – {slot.endTime}
            </span>
          ))}
        </div>
      </div>

      {/* Cancel Button */}
      {canCancel && onCancel && (
        <Button
          variant="danger"
          fullWidth
          onClick={onCancel}
          isLoading={isCancelling}
        >
          Cancel Booking
        </Button>
      )}

      {booking.status === 'cancelled' && booking.cancellationReason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-700">Cancellation Reason</p>
          <p className="text-sm text-red-600 mt-1">{booking.cancellationReason}</p>
        </div>
      )}
    </div>
  )
}
