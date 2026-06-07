import mongoose, { Document, Schema } from 'mongoose';

export interface IPeakHour {
  start: string; // HH:mm
  end: string;   // HH:mm
  multiplier: number;
}

export interface ITurfImage {
  url: string;
  publicId: string;
}

export interface IOperatingHours {
  open: string;  // HH:mm
  close: string; // HH:mm
}

export interface ICancellationPolicy {
  fullRefundHours: number;  // cancel >= fullRefundHours before → 100% refund
  halfRefundHours: number;  // cancel >= halfRefundHours before → 50% refund; else 0%
}

export interface ITurf extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  images: ITurfImage[];
  amenities: string[];
  sports: string[];
  operatingHours: IOperatingHours;
  slotInterval: number;
  basePrice: number;
  peakHours: IPeakHour[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  featuredUntil: Date | null;
  cancellationPolicy: ICancellationPolicy;
  createdAt: Date;
  updatedAt: Date;
}

const PeakHourSchema = new Schema<IPeakHour>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    multiplier: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const TurfImageSchema = new Schema<ITurfImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const TurfSchema = new Schema<ITurf>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Turf name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: (v: number[]) => v.length === 2,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    images: {
      type: [TurfImageSchema],
      default: [],
      validate: {
        validator: (v: ITurfImage[]) => v.length <= 8,
        message: 'Cannot have more than 8 images',
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
    sports: {
      type: [String],
      required: [true, 'At least one sport is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one sport is required',
      },
    },
    operatingHours: {
      open: {
        type: String,
        required: [true, 'Opening time is required'],
        match: [/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'],
      },
      close: {
        type: String,
        required: [true, 'Closing time is required'],
        match: [/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'],
      },
    },
    slotInterval: {
      type: Number,
      default: 30,
      min: [15, 'Slot interval must be at least 15 minutes'],
      max: [120, 'Slot interval cannot exceed 120 minutes'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    peakHours: {
      type: [PeakHourSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredUntil: {
      type: Date,
      default: null,
    },
    cancellationPolicy: {
      fullRefundHours: { type: Number, default: 24, min: 0 },
      halfRefundHours: { type: Number, default: 6, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geo index
TurfSchema.index({ location: '2dsphere' });
TurfSchema.index({ city: 1, isActive: 1, isVerified: 1 });
TurfSchema.index({ slug: 1 });
TurfSchema.index({ rating: -1 });
// Full-text search index
TurfSchema.index({ name: 'text', description: 'text', address: 'text', city: 'text' });

// Virtual: courts
TurfSchema.virtual('courts', {
  ref: 'Court',
  localField: '_id',
  foreignField: 'turf',
});

// Auto-generate slug before saving
TurfSchema.pre('save', async function (next) {
  if (!this.isModified('name') && this.slug) return next();

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Append city for better uniqueness
  const citySlug = this.city
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  let slug = `${baseSlug}-${citySlug}`;

  // Check uniqueness
  const TurfModel = mongoose.model('Turf');
  const existing = await TurfModel.findOne({ slug, _id: { $ne: this._id } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  this.slug = slug;
  next();
});

// Auto-expire featured status
TurfSchema.pre('save', function (next) {
  if (this.featuredUntil && this.featuredUntil < new Date()) {
    this.isFeatured = false;
  }
  next();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
TurfSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const Turf = mongoose.model<ITurf>('Turf', TurfSchema);
export default Turf;
