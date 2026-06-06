'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { motion } from 'framer-motion'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Booking, BookingStatus, Turf, Court } from '@/types'
import { Badge } from '@/components/ui/Badge'

const statusConfig: Record<
  BookingStatus,
  { label: string; variant: 'green' | 'red' | 'yellow' | 'blue' | 'grey' | 'orange' }
> = {
  pending_payment: { label: 'Payment Pending', variant: 'yellow' },
  confirmed: { label: 'Confirmed', variant: 'green' },
  cancelled: { label: 'Cancelled', variant: 'red' },
  completed: { label: 'Completed', variant: 'grey' },
  refunded: { label: 'Refunded', variant: 'blue' },
}

interface BookingCardProps {
  booking: Booking
}

export function BookingCard({ booking }: BookingCardProps) {
  const turf = booking.turf as Turf
  const court = booking.court as Court
  const statusInfo = statusConfig[booking.status]

  const startTime = booking.slots[0]?.startTime || '--'
  const endTime = booking.slots[booking.slots.length - 1]?.endTime || '--'

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Link href={`/bookings/${booking._id}`}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="flex">
            {/* Turf Image */}
            <div className="relative w-28 sm:w-36 flex-shrink-0">
              {turf.images?.[0] ? (
                <Image
                  src={turf.images[0]}
                  alt={turf.name}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="h-full bg-slate-200 flex items-center justify-center">
                  <span className="text-3xl">🏟️</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{turf.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                    <LocationOnIcon style={{ fontSize: 12 }} className="text-brand-500" />
                    <span>{turf.location?.city}</span>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} size="sm">
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <CalendarTodayIcon style={{ fontSize: 14 }} className="text-slate-400" />
                  <span>{format(parseISO(booking.date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <AccessTimeIcon style={{ fontSize: 14 }} className="text-slate-400" />
                  <span>{startTime} – {endTime}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{court.name}</span>
                <span className="text-base font-bold text-slate-900">₹{booking.totalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
