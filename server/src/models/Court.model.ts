import mongoose, { Document, Schema } from 'mongoose';

export interface ICourt extends Document {
  _id: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  name: string;
  sport: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourtSchema = new Schema<ICourt>(
  {
    turf: {
      type: Schema.Types.ObjectId,
      ref: 'Turf',
      required: [true, 'Turf reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Court name is required'],
      trim: true,
      maxlength: [80, 'Court name cannot exceed 80 characters'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CourtSchema.index({ turf: 1, isActive: 1 });
CourtSchema.index({ turf: 1, sport: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
CourtSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const Court = mongoose.model<ICourt>('Court', CourtSchema);
export default Court;
