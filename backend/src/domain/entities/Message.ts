export type MessageType = 'text' | 'offer' | 'image' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'declined';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  offerAmount?: number;
  offerStatus?: OfferStatus;
  imageUrl?: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  listingId?: string;
  lastMessageId?: string;
  agreedPrice?: number;
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  // Optional display fields, populated only for list/detail responses.
  participants?: Record<string, unknown>[];
  listing?: Record<string, unknown> | null;
  lastMessage?: Record<string, unknown> | null;
  unreadCount?: number;
}
