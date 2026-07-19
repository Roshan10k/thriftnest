import { Schema, model, Document } from 'mongoose';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  passwordHistory: string[];
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
  phone?: string;
  location?: string;
  bio?: string;
  verified: boolean;
  emailVerified: boolean;
  suspended: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  loginAttempts: number;
  lockUntil?: Date;
  tokenVersion: number;
  passwordChangedAt?: Date;
  passwordResetOtp?: string;
  passwordResetExpiry?: Date;
  rating: number;
  reviewCount: number;
  responseRate: number;
  salesCount: number;
  purchaseCount: number;
  memberSince: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    passwordHistory: { type: [String], select: false, default: [] },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    role: { type: String, enum: ['buyer', 'seller', 'both', 'admin'], default: 'buyer' },
    phone: { type: String },
    location: { type: String },
    bio: { type: String, maxlength: 300 },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    backupCodes: { type: [String], select: false, default: [] },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date, default: Date.now },
    passwordResetOtp: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.passwordHistory;
        delete ret.mfaSecret;
        delete ret.backupCodes;
      },
    },
  },
);

userSchema.index({ role: 1 });
userSchema.index({ location: 1 });

export const UserModel = model<UserDocument>('User', userSchema);
