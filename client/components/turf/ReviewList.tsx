'use client'

import { useQuery } from '@tanstack/react-query'
import { reviewApi } from '@/lib/api'
import { ReviewCard } from './ReviewCard'
import { Spinner } from '@/components/ui/Spinner'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'

interface ReviewListProps {
  turfId: string
  averageRating: number
  totalReviews: number
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const percent = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 w-3">{star}</span>
      <StarIcon style={{ fontSize: 12 }} className="text-amber-400" />
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-6">{count}</span>
    </div>
  )
}

export function ReviewList({ turfId, averageRating, totalReviews }: ReviewListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', turfId],
    queryFn: async () => {
      const res = await reviewApi.getTurfReviews(turfId, { limit: 10 })
      return res.data
    },
    enabled: !!turfId,
  })

  const reviews = data?.data || []

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-start gap-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="text-center">
          <p className="text-5xl font-bold text-slate-900">{averageRating.toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={star <= Math.round(averageRating) ? 'text-amber-400' : 'text-slate-300'}
                style={{ fontSize: 16 }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{totalReviews} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length
            return <RatingBar key={star} star={star} count={count} total={reviews.length} />
          })}
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          <StarBorderIcon className="text-slate-300 text-4xl mb-2" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
