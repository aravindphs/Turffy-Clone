'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import StarIcon from '@mui/icons-material/Star'
import ReplyIcon from '@mui/icons-material/Reply'
import { reviewApi, turfApi } from '@/lib/api'
import { ReviewCard } from '@/components/turf/ReviewCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Review } from '@/types'

export default function OwnerReviewsPage() {
  const queryClient = useQueryClient()
  const [replyModal, setReplyModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  const { data: turf } = useQuery({
    queryKey: ['my-turf'],
    queryFn: async () => {
      const res = await turfApi.getMyTurf()
      return res.data.data
    },
  })

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['owner-reviews', turf?._id],
    queryFn: async () => {
      if (!turf?._id) return { data: [] }
      const res = await reviewApi.getTurfReviews(turf._id, { limit: 50 })
      return res.data
    },
    enabled: !!turf?._id,
  })

  const replyMutation = useMutation({
    mutationFn: () => reviewApi.ownerReply(selectedReview!._id, replyText),
    onSuccess: () => {
      toast.success('Reply posted!')
      queryClient.invalidateQueries({ queryKey: ['owner-reviews'] })
      setReplyModal(false)
      setReplyText('')
    },
    onError: () => toast.error('Failed to post reply.'),
  })

  const reviews = reviewsData?.data || []

  if (isLoading) return <PageSpinner />

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Reviews</h1>
        <p className="text-slate-500 mt-1">Manage customer reviews for your turf</p>
      </div>

      {/* Rating Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-slate-900">{avgRating.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon
                key={s}
                className={s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-200'}
                style={{ fontSize: 16 }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">{reviews.length} reviews</p>
        </div>
        <div className="h-10 w-px bg-slate-200" />
        <div className="text-sm text-slate-600">
          <p>Responding to reviews shows customers you care.</p>
          <p className="text-xs text-slate-400 mt-1">
            {reviews.filter((r) => !r.ownerReply).length} reviews awaiting reply
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <StarIcon className="text-slate-300 text-5xl mb-2" />
          <p className="text-slate-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id}>
              <ReviewCard review={review} />
              {!review.ownerReply && (
                <div className="flex justify-end mt-2 mr-2">
                  <button
                    onClick={() => { setSelectedReview(review); setReplyModal(true) }}
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <ReplyIcon style={{ fontSize: 14 }} />
                    Reply to this review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Modal
        isOpen={replyModal}
        onClose={() => { setReplyModal(false); setReplyText('') }}
        title="Reply to Review"
        size="md"
      >
        <div className="space-y-4">
          {selectedReview && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600 italic">&ldquo;{selectedReview.comment}&rdquo;</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Your Reply</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Write a professional, helpful reply..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => { setReplyModal(false); setReplyText('') }}>
              Cancel
            </Button>
            <Button
              fullWidth
              isLoading={replyMutation.isPending}
              disabled={!replyText.trim()}
              onClick={() => replyMutation.mutate()}
            >
              Post Reply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
