import { Schema, model, Document, Types } from 'mongoose';

export interface TransactionDocument extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  amount: number;
  method: string;
  status: string;
  gatewayRef?: string;
  createdAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['payment', 'refund', 'withdrawal'], required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['stripe', 'esewa', 'khalti'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    gatewayRef: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret.orderId = ret.orderId?.toString();
        ret.userId = ret.userId?.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

transactionSchema.index({ orderId: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);
