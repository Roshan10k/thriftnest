import type { Review } from '../entities/Review';
import type { PaginationOptions } from './IUserRepository';

export interface IReviewRepository {
  findById(id: string): Promise<Review | null>;
  create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review>;
  findBySeller(sellerId: string, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }>;
  findByListing(listingId: string, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }>;
  findByOrderId(orderId: string): Promise<Review | null>;
  getSellerAverageRating(sellerId: string): Promise<{ rating: number; count: number }>;
}
