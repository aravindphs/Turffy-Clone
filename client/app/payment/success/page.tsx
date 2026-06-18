'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { CreateOpenMatchModal } from '@/components/matches/CreateOpenMatchModal'
import { useAuthStore } from '@/store/auth.store'
import { OpenMatch } from '@/types'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  const sport = searchParams.get('sport') || 'football'
  const turfName = searchParams.get('turf_name') || 'Turf'
  const date = searchParams.get('date') || ''
  const startTime = searchParams.get('start_time') || ''
  const endTime = searchParams.get('end_time') || ''

  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createdMatch, setCreatedMatch] = useState<OpenMatch | null>(null)

  useEffect(() => {
    // Celebration animation trigger (no-op, visual feedback via framer-motion)
  }, [])

  const handleMatchSuccess = (match: OpenMatch) => {
    setCreatedMatch(match)
    setShowCreateModal(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="h-24 w-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircleIcon className="text-brand-600" style={{ fontSize: 56 }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Booking Confirmed!</h1>
            <p className="text-slate-500 text-base mb-8">
              Your turf is reserved. Get ready to play! You&apos;ll receive a confirmation shortly.
            </p>

            {bookingId && (
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6">
                <p className="text-sm text-brand-700">
                  Booking ID:{' '}
                  <span className="font-mono font-bold">#{bookingId.slice(-8).toUpperCase()}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {bookingId && (
                <Link href={`/bookings/${bookingId}`}>
                  <Button leftIcon={<BookOnlineIcon fontSize="small" />} fullWidth>
                    View Booking
                  </Button>
                </Link>
              )}
              <Link href="/turfs">
                <Button variant="outline" leftIcon={<SportsSoccerIcon fontSize="small" />} fullWidth>
                  Book Another Turf
                </Button>
              </Link>
            </div>

            {/* Create Open Match prompt — only for regular users with a bookingId */}
            {user?.role === 'user' && bookingId && !createdMatch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6 bg-brand-50 border border-brand-200 rounded-2xl p-5"
              >
                <p className="text-sm font-semibold text-brand-900 mb-1">
                  ⚽ Want to fill your slots?
                </p>
                <p className="text-xs text-brand-700 mb-4">
                  Create an open match so other players can find and join your game!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<PeopleAltIcon fontSize="small" />}
                  className="w-full"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Open Match
                </Button>
              </motion.div>
            )}

            {/* Created match confirmation */}
            {createdMatch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5"
              >
                <p className="text-sm font-semibold text-emerald-900 mb-1">Open match created!</p>
                <p className="text-xs text-emerald-700 mb-3">
                  Players can now find and join your game.
                </p>
                <Link href={`/matches/${createdMatch._id}`}>
                  <Button size="sm" className="w-full">
                    View Your Match →
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Create Open Match Modal */}
      {bookingId && (
        <CreateOpenMatchModal
          bookingId={bookingId}
          sport={sport}
          turfName={turfName}
          date={date}
          startTime={startTime}
          endTime={endTime}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleMatchSuccess}
        />
      )}
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
