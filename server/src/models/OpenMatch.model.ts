import mongoose, { Document, Schema } from 'mongoose';

export type OpenMatchStatus = 'open' | 'full' | 'cancelled' | 'completed';
export type PlayerStatus = 'pending' | 'approved' | 'rejected';

export interface IMatchPlayer {
  user: mongoose.Types.ObjectId;
  status: PlayerStatus;
  joinedAt: Date;
}

export interface IOpenMatch extends Document {
  _id: mongoose.Types.ObjectId;
  turf: mongoose.Types.ObjectId;
  court: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  sport: string;
  city: string;
  date: Date;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  maxPlayers: number;
  minPlayers: number;
  players: IMatchPlayer[];
  status: OpenMatchStatus;
  notes: string;
  spotsLeft: number;
  createdAt: Date;
  updatedAt: Date;
}

const MatchPlayerSchema = new Schema<IMatchPlayer>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    joinedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { _id: false }
);

const OpenMatchSchema = new Schema<IOpenMatch>(
  {
    turf: {
      type: Schema.Types.ObjectId,
      ref: 'Turf',
      required: [true, 'Turf is required'],
    },
    court: {
      type: Schema.Types.ObjectId,
      ref: 'Court',
      required: [true, 'Court is required'],
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      lowercase: true,
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
    maxPlayers: {
      type: Number,
      required: [true, 'Max players is required'],
      min: [2, 'Must have at least 2 players'],
      max: [100, 'Cannot exceed 100 players'],
    },
    minPlayers: {
      type: Number,
      required: [true, 'Min players is required'],
      min: [2, 'Must have at least 2 players'],
    },
    players: {
      type: [MatchPlayerSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'full', 'cancelled', 'completed'],
      default: 'open',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: spotsLeft
OpenMatchSchema.virtual('spotsLeft').get(function (this: IOpenMatch) {
  const approvedCount = this.players.filter((p) => p.status === 'approved').length;
  return this.maxPlayers - approvedCount;
});

// Indexes
OpenMatchSchema.index({ turf: 1, date: 1, status: 1 });
OpenMatchSchema.index({ organizer: 1 });
OpenMatchSchema.index({ status: 1, date: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
OpenMatchSchema.set('toJSON', { virtuals: true, transform: (_doc: any, ret: any) => { delete ret.__v; return ret; } });

const OpenMatch = mongoose.model<IOpenMatch>('OpenMatch', OpenMatchSchema);
export default OpenMatch;
