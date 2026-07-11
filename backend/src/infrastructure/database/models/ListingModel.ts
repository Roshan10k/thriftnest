import { Schema, model, Document, Types } from 'mongoose';

export interface ListingDocument extends Document {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  condition: string;
  images: string[];
  sellerId: Types.ObjectId;
  location: string;
  views: number;
  status: string;
  negotiable: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryFee?: number;
  rating: number;
  reviewCount: number;
  flagCount: number;
  listedAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<ListingDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number },
    category: {
      type: String,
      required: true,
      enum: ['clothing', 'electronics', 'books', 'furniture', 'sports', 'toys', 'art', 'accessories', 'appliances', 'other'],
    },
    subcategory: { type: String },
    condition: {
      type: String,
      required: true,
      enum: ['brand-new', 'like-new', 'good', 'fair', 'for-parts'],
    },
    images: { type: [String], default: [] },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'reserved', 'sold', 'paused', 'removed', 'flagged'],
      default: 'active',
    },
    negotiable: { type: Boolean, default: false },
    deliveryAvailable: { type: Boolean, default: false },
    pickupAvailable: { type: Boolean, default: true },
    deliveryFee: { type: Number },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    flagCount: { type: Number, default: 0 },
    listedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        // Expose a populated seller as a nested object while keeping sellerId.
        const sv = ret.sellerId;
        if (sv && typeof sv === 'object' && !(sv instanceof Types.ObjectId)) {
          const obj = sv as Record<string, unknown>;
          ret.seller = obj;
          ret.sellerId = String(obj.id ?? obj._id ?? '');
        } else if (sv != null) {
          ret.sellerId = (sv as { toString(): string }).toString();
        }
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ sellerId: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ title: 'text', description: 'text' });

export const ListingModel = model<ListingDocument>('Listing', listingSchema);
