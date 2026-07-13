export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'both' | 'admin';
  phone: string;
  location: string;
  memberSince: string;
  verified: boolean;
  suspended?: boolean;
  mfaEnabled?: boolean;
  rating: number;
  reviewCount: number;
  responseRate: number;
  salesCount: number;
  purchaseCount: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  subcategory?: string;
  condition: Condition;
  images: string[];
  seller: User;
  location: string;
  listedAt: string;
  views: number;
  status: ListingStatus;
  negotiable: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryFee?: number;
  rating: number;
  reviewCount: number;
}

export type Category =
  | 'clothing'
  | 'electronics'
  | 'books'
  | 'furniture'
  | 'sports'
  | 'toys'
  | 'art'
  | 'accessories'
  | 'appliances'
  | 'other';

export type Condition =
  | 'brand-new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'for-parts';

export type ListingStatus =
  | 'active'
  | 'sold'
  | 'paused'
  | 'removed'
  | 'flagged';

export interface Order {
  id: string;
  listing: Listing;
  buyer: User;
  seller: User;
  status: OrderStatus;
  totalAmount: number;
  platformFee: number;
  deliveryFee: number;
  deliveryAddress: DeliveryAddress;
  deliveryMethod: DeliveryMethod;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'payment-pending'
  | 'payment-confirmed'
  | 'shipped'
  | 'delivered'
  | 'disputed'
  | 'refunded';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string;
}

export type DeliveryMethod =
  | 'standard'
  | 'express'
  | 'pickup';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'offer' | 'image' | 'system';
  offerAmount?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined';
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  listing?: Listing;
  lastMessage: Message;
  unreadCount: number;
  agreedPrice?: number;
}

export interface Review {
  id: string;
  reviewer: User;
  seller: User;
  listing: Listing;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  listing: Listing;
  addedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  type: 'payment' | 'refund' | 'withdrawal';
  amount: number;
  method: 'stripe' | 'esewa' | 'khalti';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'order' | 'offer' | 'price-drop' | 'review' | 'security';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}
