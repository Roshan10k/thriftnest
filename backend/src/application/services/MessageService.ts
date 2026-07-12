import type { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { AppError } from '../errors/AppError';
import type { MessageType } from '../../domain/entities/Message';

export class MessageService {
  constructor(
    private readonly messageRepo: IMessageRepository,
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async getOrCreateConversation(userId: string, otherUserId: string, listingId?: string) {
    const existing = await this.messageRepo.findConversationByParticipants(
      [userId, otherUserId],
      listingId,
    );
    if (existing) return existing;

    const counts: Record<string, number> = { [userId]: 0, [otherUserId]: 0 };
    return this.messageRepo.createConversation({
      participantIds: [userId, otherUserId],
      listingId,
      unreadCounts: counts,
    });
  }

  async sendMessage(senderId: string, conversationId: string, content: string, type: MessageType = 'text', offerAmount?: number) {
    const conversation = await this.messageRepo.findConversationById(conversationId);
    if (!conversation) throw AppError.notFound('Conversation');
    if (!conversation.participantIds.includes(senderId)) throw AppError.forbidden();

    const message = await this.messageRepo.createMessage({
      conversationId,
      senderId,
      content,
      type,
      offerAmount,
      offerStatus: type === 'offer' ? 'pending' : undefined,
      read: false,
    });

    const recipientId = conversation.participantIds.find((id) => id !== senderId)!;
    const newCounts = {
      ...conversation.unreadCounts,
      [recipientId]: (conversation.unreadCounts[recipientId] ?? 0) + 1,
    };
    await this.messageRepo.updateConversation(conversationId, {
      lastMessageId: message.id,
      unreadCounts: newCounts,
    });

    await this.notificationRepo.create({
      userId: recipientId,
      type: 'message',
      title: 'New Message',
      message: type === 'offer' ? `New offer: NPR ${offerAmount?.toLocaleString()}` : content.slice(0, 80),
      link: `/messages`,
      read: false,
    });

    return message;
  }

  async respondToOffer(
    userId: string,
    conversationId: string,
    messageId: string,
    action: 'accept' | 'decline' | 'counter',
    counterAmount?: number,
  ) {
    const conversation = await this.messageRepo.findConversationById(conversationId);
    if (!conversation) throw AppError.notFound('Conversation');
    if (!conversation.participantIds.includes(userId)) throw AppError.forbidden();

    const offer = await this.messageRepo.findMessageById(messageId);
    if (!offer || offer.conversationId !== conversationId || offer.type !== 'offer') {
      throw AppError.notFound('Offer');
    }
    if (offer.senderId === userId) throw AppError.badRequest('You cannot respond to your own offer');
    if (offer.offerStatus !== 'pending') throw AppError.badRequest('This offer has already been answered');

    const offerSenderId = offer.senderId;
    let systemContent = '';

    if (action === 'accept') {
      await this.messageRepo.updateMessage(messageId, { offerStatus: 'accepted' });
      await this.messageRepo.updateConversation(conversationId, { agreedPrice: offer.offerAmount });
      systemContent = `Offer of NPR ${offer.offerAmount?.toLocaleString()} accepted. The buyer can now check out at this price.`;
    } else if (action === 'decline') {
      await this.messageRepo.updateMessage(messageId, { offerStatus: 'declined' });
      systemContent = `Offer of NPR ${offer.offerAmount?.toLocaleString()} declined.`;
    } else {
      if (!counterAmount || counterAmount <= 0) throw AppError.badRequest('A counter amount is required');
      // The original offer is superseded; a fresh pending offer is created from
      // the responder so the other party can accept/decline/counter in turn.
      await this.messageRepo.updateMessage(messageId, { offerStatus: 'declined' });
      const counter = await this.messageRepo.createMessage({
        conversationId,
        senderId: userId,
        content: `Countered with NPR ${counterAmount.toLocaleString()}.`,
        type: 'offer',
        offerAmount: counterAmount,
        offerStatus: 'pending',
        read: false,
      });
      await this.messageRepo.updateConversation(conversationId, { lastMessageId: counter.id });
    }

    if (systemContent) {
      const sys = await this.messageRepo.createMessage({
        conversationId,
        senderId: userId,
        content: systemContent,
        type: 'system',
        read: false,
      });
      await this.messageRepo.updateConversation(conversationId, { lastMessageId: sys.id });
    }

    await this.notificationRepo.create({
      userId: offerSenderId,
      type: 'message',
      title: 'Offer update',
      message:
        action === 'accept' ? 'Your offer was accepted' :
        action === 'decline' ? 'Your offer was declined' :
        `Countered with NPR ${counterAmount?.toLocaleString()}`,
      link: '/messages',
      read: false,
    });

    return this.messageRepo.findMessageById(messageId);
  }

  async getMessages(userId: string, conversationId: string, page: number, limit: number) {
    const conversation = await this.messageRepo.findConversationById(conversationId);
    if (!conversation) throw AppError.notFound('Conversation');
    if (!conversation.participantIds.includes(userId)) throw AppError.forbidden();

    const result = await this.messageRepo.findByConversation(conversationId, { page, limit });
    await this.messageRepo.markAsRead(conversationId, userId);
    return result;
  }

  async getUserConversations(userId: string) {
    return this.messageRepo.findConversationsByUser(userId);
  }
}
