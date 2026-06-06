'use client'

import { useQuery } from '@tanstack/react-query'
import { turfApi } from '@/lib/api'
import { TurfForm } from '@/components/owner/TurfForm'
import { PageSpinner } from '@/components/ui/Spinner'

export default function EditTurfPage() {
  const { data: turf, isLoading } = useQuery({
    queryKey: ['my-turf'],
    queryFn: async () => {
      try {
        const res = await turfApi.getMyTurf()
        return res.data.data
      } catch {
        return null
      }
    },
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {turf ? 'Edit Turf' : 'Create Turf Listing'}
        </h1>
        <p className="text-slate-500 mt-1">
          {turf
            ? 'Update your turf information below.'
            : 'Fill in your turf details to get started.'}
        </p>
      </div>
      <TurfForm turf={turf || undefined} />
    </div>
  )
}
