'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import StarIcon from '@mui/icons-material/Star'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsIcon from '@mui/icons-material/Directions'
import CheckIcon from '@mui/icons-material/Check'
import { turfApi } from '@/lib/api'
import { Slot, Court } from '@/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { TurfGallery } from '@/components/turf/TurfGallery'
import { AmenitiesList } from '@/components/turf/AmenitiesList'
import { SlotGrid } from '@/components/turf/SlotGrid'
import { ReviewList } from '@/components/turf/ReviewList'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { PaymentButton } from '@/components/booking/PaymentButton'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

// Skeleton
function TurfDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-80 md:h-96 bg-slate-200 rounded-2xl" />
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-5 bg-slate-200 rounded-lg w-1/2" />
        <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
      </div>
    </div>
  )
}

export default function TurfDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const walkInCourtId = searchParams.get('court')
  const [selectedDate] = useState(new Date())
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1)

  const { data: turf, isLoading } = useQuery({
    queryKey: ['turf', id],
    queryFn: async () => {
      const res = await turfApi.getById(id)
      const turfData = res.data.data
      // Set initial court — prefer walk-in pre-selection via ?court= param
      if (walkInCourtId) {
        const match = turfData.courts.find((c: Court) => c._id === walkInCourtId)
        if (match) setSelectedCourt(match)
      } else if (turfData.courts.length > 0) {
        setSelectedCourt((prev) => prev ?? turfData.courts[0])
      }
      return turfData
    },
    enabled: !!id,
  })

  const handleSlotSelection = (slots: Slot[], price: number) => {
    setSelectedSlots(slots)
    setTotalPrice(price)
    // Go back to step 1 if slots are cleared
    if (slots.length === 0 && bookingStep > 1) {
      setBookingStep(1)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <TurfDetailSkeleton />
        </div>
      </div>
    )
  }

  if (!turf) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-slate-900">Turf not found</p>
          <button onClick={() => router.back()} className="mt-4 text-brand-600">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const activeCourt = selectedCourt || turf.courts[0] || null

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Walk-in Banner */}
            {walkInCourtId && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-emerald-600">📲</span>
                <p className="text-sm text-emerald-800 font-medium">Walk-in booking — court pre-selected for you</p>
              </div>
            )}

            {/* Gallery */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TurfGallery images={turf.images} turfName={turf.name} />
            </motion.div>

            {/* Turf Header */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{turf.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <LocationOnIcon className="text-brand-500" fontSize="small" />
                    <span className="text-slate-600">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(turf as any).address ?? turf.location?.address}, {(turf as any).city ?? turf.location?.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {turf.sports.map((sport) => (
                      <Badge key={sport} variant="green" size="md">{sport}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <StarIcon className="text-amber-500" fontSize="small" />
                    <span className="font-bold text-slate-900">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {((turf as any).rating ?? turf.averageRating) > 0
                        ? ((turf as any).rating ?? turf.averageRating).toFixed(1)
                        : 'New'}
                    </span>
                    <span className="text-slate-400 text-sm">({turf.totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={`https://maps.google.com/?q=${(turf as any).address ?? turf.location?.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <DirectionsIcon fontSize="small" />
                      Directions
                    </a>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-slate-600 leading-relaxed">{turf.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities</h2>
              <AmenitiesList amenities={turf.amenities} />
            </div>

            {/* Slot Grid */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <SlotGrid
                turfId={turf._id}
                turfName={turf.name}
                courts={turf.courts}
                onSelectionChange={handleSlotSelection}
              />
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Reviews</h2>
              <ReviewList
                turfId={turf._id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                averageRating={(turf as any).rating ?? turf.averageRating}
                totalReviews={turf.totalReviews}
              />
            </div>
          </div>

          {/* Right Column — Sticky Booking Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
                {/* Booking Progress Stepper */}
                <div className="flex items-center gap-2">
                  {[
                    { n: 1 as const, label: 'Slots' },
                    { n: 2 as const, label: 'Review' },
                    { n: 3 as const, label: 'Pay' },
                  ].map((step, i) => (
                    <React.Fragment key={step.n}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            bookingStep >= step.n
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {bookingStep > step.n ? (
                            <CheckIcon style={{ fontSize: 14 }} />
                          ) : (
                            step.n
                          )}
                        </div>
                        <span
                          className={`text-xs mt-1 ${
                            bookingStep >= step.n ? 'text-brand-600 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-0.5 mb-4 transition-colors ${
                            bookingStep > step.n ? 'bg-brand-600' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Price Preview */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Starting from</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      ₹{activeCourt?.basePricePerSlot ?? (activeCourt as any)?.basePrice ?? (turf as any)?.basePrice ?? 0}
                      <span className="text-sm font-normal text-slate-500">/slot</span>
                    </p>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((turf as any).rating ?? turf.averageRating) > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <StarIcon className="text-amber-400" style={{ fontSize: 16 }} />
                      <span className="font-semibold">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {((turf as any).rating ?? turf.averageRating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Step 1: slot selection placeholder or step 2/3 content */}
                {bookingStep === 1 && selectedSlots.length === 0 && (
                  <p className="text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl py-4">
                    Select time slots above to continue
                  </p>
                )}

                {bookingStep === 1 && selectedSlots.length > 0 && (
                  <>
                    <BookingSummary
                      turf={turf}
                      court={activeCourt}
                      selectedDate={selectedDate}
                      selectedSlots={selectedSlots}
                      totalPrice={totalPrice}
                    />
                    <Button className="w-full" onClick={() => setBookingStep(2)}>
                      Continue →
                    </Button>
                  </>
                )}

                {bookingStep === 2 && (
                  <>
                    <BookingSummary
                      turf={turf}
                      court={activeCourt}
                      selectedDate={selectedDate}
                      selectedSlots={selectedSlots}
                      totalPrice={totalPrice}
                    />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setBookingStep(1)}
                      >
                        ← Back
                      </Button>
                      <Button className="flex-1" onClick={() => setBookingStep(3)}>
                        Proceed to Pay
                      </Button>
                    </div>
                  </>
                )}

                {bookingStep === 3 && activeCourt && (
                  <>
                    <BookingSummary
                      turf={turf}
                      court={activeCourt}
                      selectedDate={selectedDate}
                      selectedSlots={selectedSlots}
                      totalPrice={totalPrice}
                    />
                    <PaymentButton
                      turf={turf}
                      court={activeCourt}
                      date={format(selectedDate, 'yyyy-MM-dd')}
                      selectedSlots={selectedSlots}
                      totalPrice={totalPrice}
                    />
                  </>
                )}

                {/* Turf Contact */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 text-center">
                    Need help? Contact the turf owner via chat after booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
