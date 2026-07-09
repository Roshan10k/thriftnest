export type MessageType = 'text' | 'offer' | 'image' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  offerAmount?: number;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  listingId?: string;
  lastMessageId?: string;
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  // Optional display fields, populated only for list/detail responses.
  participants?: Record<string, unknown>[];
  listing?: Record<string, unknown> | null;
  lastMessage?: Record<string, unknown> | null;
  unreadCount?: number;
}
