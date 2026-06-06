import mongoose, { Document, Schema } from 'mongoose';

export type BlockReason = 'offline_booking' | 'maintenance' | 'other';

export interface IBlockedSlot extends Document {
  _id: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  court: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  reason: BlockReason;
  notes?: string;
  blockedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlockedSlotSchema = new Schema<IBlockedSlot>(
  {
    turf: {
      type: Schema.Types.ObjectId,
      ref: 'Turf',
      required: [true, 'Turf is required'],
      index: true,
    },
    court: {
      type: Schema.Types.ObjectId,
      ref: 'Court',
      required: [true, 'Court is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'],
    },
    reason: {
      type: String,
      enum: ['offline_booking', 'maintenance', 'other'],
      default: 'offline_booking',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'BlockedBy user is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast availability checks
BlockedSlotSchema.index({ turf: 1, court: 1, date: 1, startTime: 1 }, { unique: false });
BlockedSlotSchema.index({ turf: 1, court: 1, date: 1 });

// Normalize date to midnight UTC
BlockedSlotSchema.pre('save', function (next) {
  if (this.isModified('date')) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
BlockedSlotSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const BlockedSlot = mongoose.model<IBlockedSlot>('BlockedSlot', BlockedSlotSchema);
export default BlockedSlot;
