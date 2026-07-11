import { Schema, model, Document, Types } from 'mongoose';

export interface ReviewDocument extends Document {
  reviewerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  listingId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        // Expose populated refs as nested objects while keeping the string ids.
        for (const [idKey, objKey] of [
          ['reviewerId', 'reviewer'],
          ['listingId', 'listing'],
        ] as const) {
          const v = ret[idKey];
          if (v && typeof v === 'object' && !(v instanceof Types.ObjectId)) {
            const obj = v as Record<string, unknown>;
            ret[objKey] = obj;
            ret[idKey] = String(obj.id ?? obj._id ?? '');
          } else if (v != null) {
            ret[idKey] = (v as { toString(): string }).toString();
          }
        }
        ret.sellerId = ret.sellerId?.toString();
        ret.orderId = ret.orderId?.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

reviewSchema.index({ sellerId: 1, createdAt: -1 });
reviewSchema.index({ listingId: 1 });

export const ReviewModel = model<ReviewDocument>('Review', reviewSchema);
