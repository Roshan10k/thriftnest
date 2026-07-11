import { Schema, model, Document, Types } from 'mongoose';

export interface WishlistDocument extends Document {
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
  priceAtAdd: number;
  priceAlertEnabled: boolean;
  addedAt: Date;
}

const wishlistSchema = new Schema<WishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    priceAtAdd: { type: Number, required: true },
    priceAlertEnabled: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret.userId = (ret.userId as { toString(): string } | undefined)?.toString();
        // Expose a populated listing as a nested object while keeping listingId.
        const lv = ret.listingId;
        if (lv && typeof lv === 'object' && !(lv instanceof Types.ObjectId)) {
          const obj = lv as Record<string, unknown>;
          ret.listing = obj;
          ret.listingId = String(obj.id ?? obj._id ?? '');
        } else if (lv != null) {
          ret.listingId = (lv as { toString(): string }).toString();
        }
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

wishlistSchema.index({ userId: 1, listingId: 1 }, { unique: true });
wishlistSchema.index({ listingId: 1, priceAlertEnabled: 1 });

export const WishlistModel = model<WishlistDocument>('Wishlist', wishlistSchema);
