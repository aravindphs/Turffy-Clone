'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import GrassIcon from '@mui/icons-material/Grass'
import { turfApi } from '@/lib/api'
import { CourtManager } from '@/components/owner/CourtManager'
import { PricingForm } from '@/components/owner/PricingForm'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { useState } from 'react'

export default function OwnerTurfPage() {
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null)

  const { data: turf, isLoading } = useQuery({
    queryKey: ['my-turf'],
    queryFn: async () => {
      const res = await turfApi.getMyTurf()
      return res.data.data
    },
  })

  if (isLoading) return <PageSpinner />

  if (!turf) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <GrassIcon className="text-slate-300 text-5xl mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No turf listed yet</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Create your turf listing to start accepting bookings.
          </p>
          <Link href="/turf/edit">
            <Button leftIcon={<AddIcon />}>Create Turf Listing</Button>
          </Link>
        </div>
      </div>
    )
  }

  const selectedCourt = turf.courts.find((c) => c._id === selectedCourtId) || turf.courts[0]
  const statusVariant =
    turf.status === 'approved' ? 'green' : turf.status === 'pending' ? 'yellow' : 'red'

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Turf</h1>
          <p className="text-slate-500 mt-1">Manage your turf listing and courts</p>
        </div>
        <Link href="/turf/edit">
          <Button size="sm" leftIcon={<EditIcon fontSize="small" />} variant="outline">
            Edit Turf
          </Button>
        </Link>
      </div>

      {/* Turf Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative h-48">
          {turf.images[0] ? (
            <Image src={turf.images[0]} alt={turf.name} fill className="object-cover" />
          ) : (
            <div className="h-full bg-slate-200 flex items-center justify-center text-4xl">🏟️</div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={statusVariant} dot>
              {turf.status.charAt(0).toUpperCase() + turf.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{turf.name}</h2>
              <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                <LocationOnIcon fontSize="small" className="text-brand-500" />
                {turf.location.address}, {turf.location.city}
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              <StarIcon className="text-amber-500" style={{ fontSize: 16 }} />
              <span className="font-bold text-sm">
                {turf.averageRating > 0 ? turf.averageRating.toFixed(1) : 'New'}
              </span>
              <span className="text-slate-400 text-xs">({turf.totalReviews})</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {turf.sports.map((s) => <Badge key={s} variant="blue" size="sm">{s}</Badge>)}
          </div>
          {turf.status === 'pending' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
              Your turf is under review. Our team will approve it within 24 hours.
            </div>
          )}
        </div>
      </div>

      {/* Courts Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CourtManager turfId={turf._id} courts={turf.courts} />
      </div>

      {/* Pricing (for selected court) */}
      {turf.courts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Peak Hour Pricing</h3>
            {turf.courts.length > 1 && (
              <select
                value={selectedCourtId || ''}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {turf.courts.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          {selectedCourt && (
            <PricingForm turfId={turf._id} court={selectedCourt} />
          )}
        </div>
      )}
    </div>
  )
}
