import { MessageModel, ConversationModel } from '../database/models/MessageModel';
import type { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { Message, Conversation } from '../../domain/entities/Message';

export class MongoMessageRepository implements IMessageRepository {
  async findMessageById(id: string): Promise<Message | null> {
    const doc = await MessageModel.findById(id);
    return doc ? (doc.toJSON() as unknown as Message) : null;
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const doc = await MessageModel.create(data);
    return doc.toJSON() as unknown as Message;
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message | null> {
    const doc = await MessageModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return doc ? (doc.toJSON() as unknown as Message) : null;
  }

  async findByConversation(conversationId: string, options: PaginationOptions): Promise<{ messages: Message[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      MessageModel.find({ conversationId }).sort({ createdAt: -1 }).skip(skip).limit(options.limit),
      MessageModel.countDocuments({ conversationId }),
    ]);
    return {
      messages: docs.reverse().map((d) => d.toJSON() as unknown as Message),
      total,
    };
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      { conversationId, senderId: { $ne: userId }, read: false },
      { $set: { read: true } },
    );
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    });
  }

  async findConversationById(id: string): Promise<Conversation | null> {
    const doc = await ConversationModel.findById(id);
    return doc ? this.convToEntity(doc) : null;
  }

  async findConversationByParticipants(participantIds: string[], listingId?: string): Promise<Conversation | null> {
    const query: Record<string, unknown> = {
      participantIds: { $all: participantIds, $size: participantIds.length },
    };
    if (listingId) query.listingId = listingId;
    const doc = await ConversationModel.findOne(query);
    return doc ? this.convToEntity(doc) : null;
  }

  async createConversation(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
    const doc = await ConversationModel.create(data);
    return this.convToEntity(doc);
  }

  async updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | null> {
    const doc = await ConversationModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return doc ? this.convToEntity(doc) : null;
  }

  async findConversationsByUser(userId: string): Promise<Conversation[]> {
    const docs = await ConversationModel.find({ participantIds: userId })
      .sort({ updatedAt: -1 })
      .populate({ path: 'participantIds', select: '-passwordHash' })
      .populate({ path: 'listingId', populate: { path: 'sellerId', select: '-passwordHash' } })
      .populate('lastMessageId');

    return docs.map((doc) => {
      // Each populated subdoc is a Mongoose document; toJSON() applies its own
      // transform (stripping passwordHash/mfaSecret etc. for users).
      const toJ = (v: unknown) =>
        v && typeof (v as { toJSON?: unknown }).toJSON === 'function'
          ? (v as { toJSON(): Record<string, unknown> }).toJSON()
          : (v as Record<string, unknown>);

      const participants = Array.isArray(doc.participantIds)
        ? (doc.participantIds as unknown[]).map(toJ)
        : [];
      const listing = doc.listingId ? toJ(doc.listingId) : null;
      const lastMessage = doc.lastMessageId ? toJ(doc.lastMessageId) : null;
      const counts =
        doc.unreadCounts instanceof Map
          ? Object.fromEntries(doc.unreadCounts)
          : ((doc.unreadCounts as unknown as Record<string, number>) ?? {});

      return {
        id: String(doc._id),
        participantIds: participants.map((p) => String(p.id ?? p._id ?? '')),
        listingId: listing ? String(listing.id ?? listing._id ?? '') : undefined,
        lastMessageId: lastMessage ? String(lastMessage.id ?? lastMessage._id ?? '') : undefined,
        agreedPrice: doc.agreedPrice,
        unreadCounts: counts,
        unreadCount: counts[userId] ?? 0,
        participants,
        listing,
        lastMessage,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      } as Conversation;
    });
  }

  private convToEntity(doc: InstanceType<typeof ConversationModel>): Conversation {
    const obj = doc.toObject({ virtuals: true }) as unknown as Record<string, unknown>;
    const counts = obj.unreadCounts as Map<string, number> | Record<string, number> | undefined;
    const unreadCounts: Record<string, number> =
      counts instanceof Map
        ? Object.fromEntries(counts)
        : (counts as Record<string, number>) ?? {};
    return {
      id: String(obj._id ?? obj.id),
      participantIds: ((obj.participantIds as unknown[]) ?? []).map((id) => String(id)),
      listingId: obj.listingId != null ? String(obj.listingId) : undefined,
      lastMessageId: obj.lastMessageId != null ? String(obj.lastMessageId) : undefined,
      agreedPrice: obj.agreedPrice as number | undefined,
      unreadCounts,
      createdAt: obj.createdAt as Date,
      updatedAt: obj.updatedAt as Date,
    };
  }
}
