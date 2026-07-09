import type { DeliveryAddress, DeliveryMethod } from '../value-objects/DeliveryAddress';

export type OrderStatus =
  | 'payment-pending'
  | 'payment-confirmed'
  | 'shipped'
  | 'delivered'
  | 'disputed'
  | 'refunded';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  totalAmount: number;
  platformFee: number;
  deliveryFee: number;
  deliveryAddress: DeliveryAddress;
  deliveryMethod: DeliveryMethod;
  trackingNumber?: string;
  disputeReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
