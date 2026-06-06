'use client'

import { useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    // Celebration animation trigger (no-op, visual feedback via framer-motion)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center max-w-md"
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
          </motion.div>
        </motion.div>
      </div>
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
