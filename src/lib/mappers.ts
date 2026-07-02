import type { User, Listing, Order, Review, WishlistItem, Notification, Conversation, Message } from '../types';

type Raw = Record<string, unknown>;

function str(v: unknown, fallback = '') {
  return v != null ? String(v) : fallback;
}
function num(v: unknown) {
  return Number(v ?? 0);
}
function bool(v: unknown) {
  return Boolean(v);
}
function arr<T>(v: unknown, map: (x: unknown) => T): T[] {
  return Array.isArray(v) ? v.map(map) : [];
}

export function toUser(raw: Raw): User {
  return {
    id: str(raw.id),
    email: str(raw.email),
    name: str(raw.name),
    avatar: raw.avatar as string | undefined,
    role: (raw.role as User['role']) ?? 'buyer',
    phone: str(raw.phone),
    location: str(raw.location),
    memberSince: raw.memberSince
      ? new Date(raw.memberSince as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '',
    verified: bool(raw.verified),
    rating: num(raw.rating),
    reviewCount: num(raw.reviewCount),
    responseRate: num(raw.responseRate),
    salesCount: num(raw.salesCount),
    purchaseCount: num(raw.purchaseCount),
  };
}

export function toListing(raw: Raw): Listing {
  return {
    id: str(raw.id ?? raw._id),
    title: str(raw.title),
    description: str(raw.description),
    price: num(raw.price),
    originalPrice: raw.originalPrice != null ? num(raw.originalPrice) : undefined,
    category: (raw.category as Listing['category']) ?? 'other',
    subcategory: raw.subcategory as string | undefined,
    condition: (raw.condition as Listing['condition']) ?? 'good',
    images: arr(raw.images, (x) => str(x)),
    seller: raw.seller ? toUser(raw.seller as Raw) : ({} as User),
    location: str(raw.location),
    listedAt: str(raw.listedAt ?? raw.createdAt),
    views: num(raw.views),
    status: (raw.status as Listing['status']) ?? 'active',
    negotiable: bool(raw.negotiable),
    deliveryAvailable: bool(raw.deliveryAvailable),
    pickupAvailable: bool(raw.pickupAvailable),
    deliveryFee: raw.deliveryFee != null ? num(raw.deliveryFee) : undefined,
    rating: num(raw.rating),
    reviewCount: num(raw.reviewCount),
  };
}

export function toOrder(raw: Raw): Order {
  return {
    id: str(raw.id ?? raw._id),
    listing: raw.listing ? toListing(raw.listing as Raw) : toListing({}),
    buyer: raw.buyer ? toUser(raw.buyer as Raw) : ({} as User),
    seller: raw.seller ? toUser(raw.seller as Raw) : ({} as User),
    status: (raw.status as Order['status']) ?? 'payment-pending',
    totalAmount: num(raw.totalAmount),
    platformFee: num(raw.platformFee),
    deliveryFee: num(raw.deliveryFee),
    deliveryAddress: (raw.deliveryAddress as Order['deliveryAddress']) ?? {
      fullName: '', phone: '', street: '', city: '', district: '', postalCode: '',
    },
    deliveryMethod: (raw.deliveryMethod as Order['deliveryMethod']) ?? 'pickup',
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}

export function toReview(raw: Raw): Review {
  return {
    id: str(raw.id ?? raw._id),
    reviewer: raw.reviewer ? toUser(raw.reviewer as Raw) : ({} as User),
    seller: raw.seller ? toUser(raw.seller as Raw) : ({} as User),
    listing: raw.listing ? toListing(raw.listing as Raw) : toListing({}),
    rating: num(raw.rating),
    comment: str(raw.comment),
    createdAt: str(raw.createdAt),
  };
}

export function toWishlistItem(raw: Raw): WishlistItem {
  return {
    id: str(raw.id ?? raw._id),
    listing: raw.listing ? toListing(raw.listing as Raw) : toListing({}),
    addedAt: str(raw.addedAt ?? raw.createdAt),
  };
}

export function toNotification(raw: Raw): Notification {
  return {
    id: str(raw.id ?? raw._id),
    userId: str(raw.userId),
    type: (raw.type as Notification['type']) ?? 'order',
    title: str(raw.title),
    message: str(raw.message),
    read: bool(raw.read),
    timestamp: str(raw.timestamp ?? raw.createdAt),
  };
}

export function toMessage(raw: Raw): Message {
  return {
    id: str(raw.id ?? raw._id),
    conversationId: str(raw.conversationId),
    senderId: str(raw.senderId),
    content: str(raw.content),
    type: (raw.type as Message['type']) ?? 'text',
    offerAmount: raw.offerAmount != null ? num(raw.offerAmount) : undefined,
    timestamp: str(raw.createdAt ?? raw.timestamp),
    read: bool(raw.read),
  };
}

export function toConversation(raw: Raw): Conversation {
  return {
    id: str(raw.id ?? raw._id),
    participants: arr(raw.participants, (x) => toUser(x as Raw)),
    listing: raw.listing ? toListing(raw.listing as Raw) : undefined,
    lastMessage: raw.lastMessage ? toMessage(raw.lastMessage as Raw) : ({} as Message),
    unreadCount: num(raw.unreadCount),
  };
}
