import { Review, User } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import StarIcon from '@mui/icons-material/Star'
import { format, parseISO } from 'date-fns'
import ReplyIcon from '@mui/icons-material/Reply'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const user = review.user as User
  const userName = typeof review.user === 'string' ? 'User' : user.name
  const userAvatar = typeof review.user === 'string' ? undefined : user.avatar

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <Avatar src={userAvatar} alt={userName} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-900 text-sm">{userName}</p>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {format(parseISO(review.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          {/* Stars */}
          <div className="flex items-center gap-0.5 my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={star <= review.rating ? 'text-amber-400' : 'text-slate-200'}
                style={{ fontSize: 16 }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>

          {/* Owner Reply */}
          {review.ownerReply && (
            <div className="mt-3 pl-3 border-l-2 border-brand-300 bg-brand-50 rounded-r-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ReplyIcon className="text-brand-600" style={{ fontSize: 14 }} />
                <span className="text-xs font-semibold text-brand-700">Owner&apos;s Reply</span>
              </div>
              <p className="text-sm text-slate-600">{review.ownerReply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
