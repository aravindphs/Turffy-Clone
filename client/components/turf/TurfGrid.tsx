'use client'

import { TurfCard } from './TurfCard'
import { Turf } from '@/types'

// Skeleton Card
function TurfCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <div className="h-8 bg-slate-200 rounded-lg w-24" />
          <div className="h-8 bg-slate-200 rounded-lg w-20" />
        </div>
      </div>
    </div>
  )
}

interface TurfGridProps {
  turfs: Turf[]
  isLoading?: boolean
  skeletonCount?: number
}

export function TurfGrid({ turfs, isLoading = false, skeletonCount = 6 }: TurfGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <TurfCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (turfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🏟️</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No turfs found</h3>
        <p className="text-slate-500 max-w-sm">
          Try adjusting your filters or search in a different city.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {turfs.map((turf) => (
        <TurfCard key={turf._id} turf={turf} />
      ))}
    </div>
  )
}
