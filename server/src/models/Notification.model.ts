import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'slot_blocked'
  | 'payment_success'
  | 'chat_message'
  | 'review_reply'
  | 'turf_approved'
  | 'turf_rejected';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'slot_blocked',
        'payment_success',
        'chat_message',
        'review_reply',
        'turf_approved',
        'turf_rejected',
      ],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: [1000, 'Body cannot exceed 1000 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1 });
// TTL: auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
NotificationSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
