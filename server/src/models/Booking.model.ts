import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  court: mongoose.Types.ObjectId;
  date: Date;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
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
    court: {
      type: Schema.Types.ObjectId,
      ref: 'Court',
      required: [true, 'Court is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
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
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      sparse: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancellationReason: {
      type: String,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
BookingSchema.index({ user: 1, status: 1, date: -1 });
BookingSchema.index({ turf: 1, date: 1, status: 1 });
BookingSchema.index({ court: 1, date: 1, status: 1 });
BookingSchema.index({ razorpayOrderId: 1 }, { sparse: true });

// Normalize date to midnight UTC for consistent date-only queries
BookingSchema.pre('save', function (next) {
  if (this.isModified('date')) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

BookingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
