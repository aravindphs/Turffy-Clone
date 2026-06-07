import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'owner' | 'admin';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  googleId?: string;
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  subscription: {
    tier: 'free' | 'pro' | 'business';
    validUntil: Date | null;
    razorpaySubId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  compareRefreshToken(candidateToken: string): Promise<boolean>;
  isSubscriptionActive(): boolean;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'owner', 'admin'],
      default: 'user',
    },
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'pro', 'business'],
        default: 'free',
      },
      validUntil: {
        type: Date,
        default: null,
      },
      razorpaySubId: {
        type: String,
        select: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Hash refresh token before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('refreshToken') || !this.refreshToken) return next();
  // Only hash if not already hashed (bcrypt hashes start with $2b$)
  if (!this.refreshToken.startsWith('$2b$')) {
    this.refreshToken = await bcrypt.hash(this.refreshToken, 10);
  }
  next();
});

UserSchema.methods.compareRefreshToken = async function (
  candidateToken: string
): Promise<boolean> {
  if (!this.refreshToken) return false;
  return bcrypt.compare(candidateToken, this.refreshToken);
};

UserSchema.methods.isSubscriptionActive = function (): boolean {
  const sub = this.subscription as { tier: string; validUntil: Date | null } | undefined;
  if (!sub || sub.tier === 'free') return false;
  return sub.validUntil === null || sub.validUntil > new Date();
};

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Remove sensitive fields from JSON output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
UserSchema.set('toJSON', { transform: (_doc: any, ret: any) => { delete ret.refreshToken; delete ret.googleId; delete ret.__v; return ret; } });

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
export default User;
