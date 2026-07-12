import type { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IListingRepository } from '../../domain/repositories/IListingRepository';
import type { CreateReviewDtoType } from '../dtos/review.dto';
import { AppError } from '../errors/AppError';

export class ReviewService {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly userRepo: IUserRepository,
    private readonly listingRepo: IListingRepository,
  ) {}

  async create(reviewerId: string, dto: CreateReviewDtoType) {
    const order = await this.orderRepo.findById(dto.orderId);
    if (!order) throw AppError.notFound('Order');
    if (order.buyerId !== reviewerId) throw AppError.forbidden('Only the buyer can review');
    if (order.status !== 'delivered') throw AppError.badRequest('Order must be delivered to leave a review');

    const existing = await this.reviewRepo.findByOrderId(dto.orderId);
    if (existing) throw AppError.conflict('Review already submitted for this order');

    const review = await this.reviewRepo.create({
      reviewerId,
      sellerId: order.sellerId,
      listingId: order.listingId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const { rating, count } = await this.reviewRepo.getSellerAverageRating(order.sellerId);
    await this.userRepo.update(order.sellerId, { rating, reviewCount: count });
    await this.listingRepo.updateRating(order.listingId, dto.rating, 1);

    return review;
  }

  async getSellerReviews(sellerId: string, page: number, limit: number) {
    return this.reviewRepo.findBySeller(sellerId, { page, limit });
  }

  async getListingReviews(listingId: string, page: number, limit: number) {
    return this.reviewRepo.findByListing(listingId, { page, limit });
  }
}
