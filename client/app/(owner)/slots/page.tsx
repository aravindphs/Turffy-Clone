'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { turfApi } from '@/lib/api'
import { SlotGrid } from '@/components/turf/SlotGrid'
import { SlotBlocker } from '@/components/owner/SlotBlocker'
import { PageSpinner } from '@/components/ui/Spinner'
import { Slot } from '@/types'
import InfoIcon from '@mui/icons-material/Info'

export default function OwnerSlotsPage() {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [blockerOpen, setBlockerOpen] = useState(false)

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
      <div className="p-6 lg:p-8">
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No turf found. Please create your turf first.</p>
        </div>
      </div>
    )
  }

  const handleOwnerSlotClick = (slot: Slot) => {
    if (slot.status === 'booked') return
    setSelectedSlot(slot)
    setBlockerOpen(true)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Slot Management</h1>
        <p className="text-slate-500 mt-1">Block or unblock slots for offline bookings and maintenance</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <InfoIcon className="text-blue-500 flex-shrink-0 mt-0.5" fontSize="small" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">Owner Mode</p>
          <p>Click any <strong>available</strong> slot to block it for an offline booking or maintenance. Click a <strong>blocked</strong> slot to unblock it.</p>
        </div>
      </div>

      {/* Slot Grid in Owner Mode */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <SlotGrid
          turfId={turf._id}
          courts={turf.courts}
          ownerMode={true}
          onOwnerSlotClick={handleOwnerSlotClick}
        />
      </div>

      {/* Slot Blocker Modal */}
      <SlotBlocker
        slot={selectedSlot}
        turfId={turf._id}
        isOpen={blockerOpen}
        onClose={() => {
          setBlockerOpen(false)
          setSelectedSlot(null)
        }}
      />
    </div>
  )
}
