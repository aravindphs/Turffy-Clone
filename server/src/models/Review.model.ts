import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  ownerReply?: string;
  ownerRepliedAt?: Date;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    turf: {
      type: Schema.Types.ObjectId,
      ref: 'Turf',
      required: [true, 'Turf is required'],
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    ownerReply: {
      type: String,
      trim: true,
      maxlength: [1000, 'Owner reply cannot exceed 1000 characters'],
    },
    ownerRepliedAt: {
      type: Date,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per turf
ReviewSchema.index({ user: 1, turf: 1 }, { unique: true });
ReviewSchema.index({ turf: 1, isVisible: 1, createdAt: -1 });
ReviewSchema.index({ booking: 1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ReviewSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const Review = mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
