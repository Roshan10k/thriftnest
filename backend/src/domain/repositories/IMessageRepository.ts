import type { Message, Conversation } from '../entities/Message';
import type { PaginationOptions } from './IUserRepository';

export interface IMessageRepository {
  findMessageById(id: string): Promise<Message | null>;
  createMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>;
  updateMessage(id: string, data: Partial<Message>): Promise<Message | null>;
  findByConversation(conversationId: string, options: PaginationOptions): Promise<{ messages: Message[]; total: number }>;
  markAsRead(conversationId: string, userId: string): Promise<void>;

  findConversationById(id: string): Promise<Conversation | null>;
  findConversationByParticipants(participantIds: string[], listingId?: string): Promise<Conversation | null>;
  createConversation(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation>;
  updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation | null>;
  findConversationsByUser(userId: string): Promise<Conversation[]>;
}
