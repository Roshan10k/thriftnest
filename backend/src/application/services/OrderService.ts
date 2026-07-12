import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IListingRepository } from '../../domain/repositories/IListingRepository';
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import type { IEmailService } from '../interfaces/IEmailService';
import type { CreateOrderDtoType, UpdateOrderStatusDtoType } from '../dtos/order.dto';
import { AppError } from '../errors/AppError';

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 5);

export class OrderService {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly listingRepo: IListingRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly notificationRepo: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly messageRepo: IMessageRepository,
  ) {}

  async create(buyerId: string, dto: CreateOrderDtoType) {
    const listing = await this.listingRepo.findById(dto.listingId);
    if (!listing) throw AppError.notFound('Listing');
    if (listing.status !== 'active') throw AppError.badRequest('Listing is no longer available');
    if (listing.sellerId === buyerId) throw AppError.badRequest('You cannot buy your own listing');

    // Honour a negotiated price only when the referenced conversation is for
    // this listing, the buyer is a participant, and it has an accepted offer.
    let itemPrice = listing.price;
    if (dto.conversationId) {
      const conversation = await this.messageRepo.findConversationById(dto.conversationId);
      if (
        conversation &&
        conversation.listingId === dto.listingId &&
        conversation.participantIds.includes(buyerId) &&
        conversation.agreedPrice != null &&
        conversation.agreedPrice > 0 &&
        conversation.agreedPrice <= listing.price
      ) {
        itemPrice = conversation.agreedPrice;
      }
    }

    const deliveryFee = dto.deliveryMethod !== 'pickup' ? (listing.deliveryFee ?? 0) : 0;
    const platformFee = Math.round(itemPrice * (PLATFORM_FEE_PERCENT / 100));
    const totalAmount = itemPrice + deliveryFee;

    const order = await this.orderRepo.create({
      listingId: dto.listingId,
      buyerId,
      sellerId: listing.sellerId,
      status: 'payment-pending',
      totalAmount,
      platformFee,
      deliveryFee,
      deliveryAddress: dto.deliveryAddress,
      deliveryMethod: dto.deliveryMethod,
    });

    // Reserve the listing so it leaves Browse and can't be ordered twice.
    await this.listingRepo.updateStatus(dto.listingId, 'reserved');

    await this.transactionRepo.create({
      orderId: order.id,
      userId: buyerId,
      type: 'payment',
      amount: totalAmount,
      method: dto.paymentMethod,
      status: 'pending',
    });

    await this.notificationRepo.create({
      userId: listing.sellerId,
      type: 'order',
      title: 'New Order Received',
      message: `You have a new order for "${listing.title}"`,
      link: `/orders/${order.id}`,
      read: false,
    });

    return order;
  }

  async getById(id: string, userId: string, isAdmin = false) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw AppError.notFound('Order');
    if (!isAdmin && order.buyerId !== userId && order.sellerId !== userId) {
      throw AppError.forbidden();
    }
    return order;
  }

  async getBuyerOrders(buyerId: string, page: number, limit: number) {
    return this.orderRepo.findByBuyer(buyerId, { page, limit });
  }

  async getSellerOrders(sellerId: string, page: number, limit: number) {
    return this.orderRepo.findBySeller(sellerId, { page, limit });
  }

  async updateStatus(id: string, userId: string, dto: UpdateOrderStatusDtoType, isAdmin = false) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw AppError.notFound('Order');

    const allowedByBuyer = ['payment-confirmed', 'delivered', 'disputed'];
    const allowedBySeller = ['payment-confirmed', 'shipped'];

    if (!isAdmin) {
      if (order.buyerId === userId && !allowedByBuyer.includes(dto.status)) {
        throw AppError.forbidden('Buyers can only mark orders as delivered or disputed');
      }
      if (order.sellerId === userId && !allowedBySeller.includes(dto.status)) {
        throw AppError.forbidden('Sellers can only confirm payment or mark as shipped');
      }
      if (order.buyerId !== userId && order.sellerId !== userId) {
        throw AppError.forbidden();
      }
    }

    await this.orderRepo.updateStatus(id, dto.status);

    if (dto.status === 'shipped' && dto.trackingNumber) {
      await this.orderRepo.update(id, { trackingNumber: dto.trackingNumber });
      await this.notificationRepo.create({
        userId: order.buyerId,
        type: 'order',
        title: 'Order Shipped',
        message: `Your order has been shipped. Tracking: ${dto.trackingNumber}`,
        link: `/orders/${id}`,
        read: false,
      });
    }

    if (dto.status === 'disputed' && dto.disputeReason) {
      await this.orderRepo.update(id, { disputeReason: dto.disputeReason });
    }

    if (dto.status === 'delivered') {
      await this.listingRepo.updateStatus(order.listingId, 'sold');
    }

    // If the order is refunded, free the listing so it returns to Browse.
    if (dto.status === 'refunded') {
      await this.listingRepo.updateStatus(order.listingId, 'active');
    }

    return this.orderRepo.findById(id);
  }
}
