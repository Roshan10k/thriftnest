import { z } from 'zod';

const DeliveryAddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  street: z.string().min(3),
  city: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().min(4),
});

export const CreateOrderDto = z.object({
  listingId: z.string().min(1),
  deliveryAddress: DeliveryAddressSchema,
  deliveryMethod: z.enum(['standard', 'express', 'pickup']),
  paymentMethod: z.enum(['stripe', 'esewa', 'khalti']),
  // When buying at a negotiated price, the conversation whose accepted offer
  // sets the agreed price. The server validates and uses that price.
  conversationId: z.string().optional(),
});

export const UpdateOrderStatusDto = z.object({
  status: z.enum(['payment-confirmed', 'shipped', 'delivered', 'disputed', 'refunded']),
  trackingNumber: z.string().optional(),
  disputeReason: z.string().optional(),
});

export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;
export type UpdateOrderStatusDtoType = z.infer<typeof UpdateOrderStatusDto>;
