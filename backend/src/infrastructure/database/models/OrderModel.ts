import { Schema, model, Document, Types } from 'mongoose';

const deliveryAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
);

export interface OrderDocument extends Document {
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  status: string;
  totalAmount: number;
  platformFee: number;
  deliveryFee: number;
  deliveryAddress: Record<string, string>;
  deliveryMethod: string;
  trackingNumber?: string;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['payment-pending', 'payment-confirmed', 'shipped', 'delivered', 'disputed', 'refunded'],
      default: 'payment-pending',
    },
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    deliveryMethod: { type: String, enum: ['standard', 'express', 'pickup'], required: true },
    trackingNumber: { type: String },
    disputeReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        // Expose populated refs as nested objects (listing/buyer/seller) while
        // keeping the plain string ids. A non-populated value is an ObjectId.
        for (const [idKey, objKey] of [
          ['listingId', 'listing'],
          ['buyerId', 'buyer'],
          ['sellerId', 'seller'],
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
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

export const OrderModel = model<OrderDocument>('Order', orderSchema);
