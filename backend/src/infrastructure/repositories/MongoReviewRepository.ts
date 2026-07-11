import mongoose from 'mongoose';
import { ReviewModel } from '../database/models/ReviewModel';
import type { IReviewRepository } from '../../domain/repositories/IReviewRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { Review } from '../../domain/entities/Review';

function toEntity(doc: InstanceType<typeof ReviewModel>): Review {
  return doc.toJSON() as unknown as Review;
}

export class MongoReviewRepository implements IReviewRepository {
  async findById(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findById(id);
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const doc = await ReviewModel.create(data);
    return toEntity(doc);
  }

  async findBySeller(sellerId: string, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ReviewModel.find({ sellerId })
        .skip(skip).limit(options.limit).sort({ createdAt: -1 })
        .populate({ path: 'reviewerId', select: 'name avatar' })
        .populate({ path: 'listingId', select: 'title images' }),
      ReviewModel.countDocuments({ sellerId }),
    ]);
    return { reviews: docs.map(toEntity), total };
  }

  async findByListing(listingId: string, options: PaginationOptions): Promise<{ reviews: Review[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ReviewModel.find({ listingId })
        .skip(skip).limit(options.limit).sort({ createdAt: -1 })
        .populate({ path: 'reviewerId', select: 'name avatar' })
        .populate({ path: 'listingId', select: 'title images' }),
      ReviewModel.countDocuments({ listingId }),
    ]);
    return { reviews: docs.map(toEntity), total };
  }

  async findByOrderId(orderId: string): Promise<Review | null> {
    const doc = await ReviewModel.findOne({ orderId });
    return doc ? toEntity(doc) : null;
  }

  async getSellerAverageRating(sellerId: string): Promise<{ rating: number; count: number }> {
    // Aggregation pipelines don't auto-cast, so the string id must be an
    // ObjectId to match the stored sellerId field.
    const result = await ReviewModel.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (result.length === 0) return { rating: 0, count: 0 };
    return { rating: Math.round(result[0].avgRating * 10) / 10, count: result[0].count };
  }
}
