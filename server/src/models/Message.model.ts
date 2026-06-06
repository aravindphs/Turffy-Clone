import mongoose, { Document, Schema } from 'mongoose';

export type ReceiverRole = 'user' | 'owner';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiverRole: ReceiverRole;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    receiverRole: {
      type: String,
      enum: ['user', 'owner'],
      required: [true, 'Receiver role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
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

MessageSchema.index({ booking: 1, createdAt: 1 });
MessageSchema.index({ booking: 1, isRead: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
MessageSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
