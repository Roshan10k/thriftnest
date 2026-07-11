import { Schema, model, Document, Types } from 'mongoose';

export interface MessageDocument extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: string;
  offerAmount?: number;
  offerStatus?: string;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
}

export interface ConversationDocument extends Document {
  participantIds: Types.ObjectId[];
  listingId?: Types.ObjectId;
  lastMessageId?: Types.ObjectId;
  agreedPrice?: number;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'offer', 'image', 'system'], default: 'text' },
    offerAmount: { type: Number },
    offerStatus: { type: String, enum: ['pending', 'accepted', 'declined'] },
    imageUrl: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret.conversationId = ret.conversationId?.toString();
        ret.senderId = ret.senderId?.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

const conversationSchema = new Schema<ConversationDocument>(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    agreedPrice: { type: Number },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: unknown, ret: Record<string, unknown>) {
        ret.id = String(ret._id);
        ret.participantIds = (ret.participantIds as Types.ObjectId[] | undefined)?.map((id) => id.toString());
        ret.listingId = (ret.listingId as { toString(): string } | undefined)?.toString();
        ret.lastMessageId = (ret.lastMessageId as { toString(): string } | undefined)?.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
conversationSchema.index({ participantIds: 1 });

export const MessageModel = model<MessageDocument>('Message', messageSchema);
export const ConversationModel = model<ConversationDocument>('Conversation', conversationSchema);
