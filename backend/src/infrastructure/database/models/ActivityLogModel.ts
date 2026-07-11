import { Schema, model, Document, Types } from 'mongoose';

export interface ActivityLogDocument extends Document {
  userId?: Types.ObjectId;
  action: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed', 'warning'], required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret.userId = ret.userId?.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export const ActivityLogModel = model<ActivityLogDocument>('ActivityLog', activityLogSchema);
