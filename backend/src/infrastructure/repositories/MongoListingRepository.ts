import mongoose from 'mongoose';
import { ListingModel } from '../database/models/ListingModel';
import type { IListingRepository, ListingFilters } from '../../domain/repositories/IListingRepository';
import type { PaginationOptions } from '../../domain/repositories/IUserRepository';
import type { Listing, ListingStatus } from '../../domain/entities/Listing';

const SELLER_POPULATE = { path: 'sellerId', select: '-passwordHash' };

function toEntity(doc: InstanceType<typeof ListingModel>): Listing {
  return doc.toJSON() as unknown as Listing;
}

export class MongoListingRepository implements IListingRepository {
  async findById(id: string): Promise<Listing | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await ListingModel.findById(id).populate(SELLER_POPULATE);
    return doc ? toEntity(doc) : null;
  }

  async create(data: Omit<Listing, 'id' | 'listedAt' | 'updatedAt'>): Promise<Listing> {
    const doc = await ListingModel.create(data);
    return toEntity(doc);
  }

  async update(id: string, data: Partial<Listing>): Promise<Listing | null> {
    const doc = await ListingModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return doc ? toEntity(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ListingModel.findByIdAndDelete(id);
    return !!result;
  }

  async findAll(filters: ListingFilters, options: PaginationOptions): Promise<{ listings: Listing[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.condition) query.condition = filters.condition;
    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    } else if (filters.excludeSellerId) {
      query.sellerId = { $ne: filters.excludeSellerId };
    }
    if (filters.location) query.location = new RegExp(filters.location, 'i');
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) (query.price as Record<string, number>).$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (query.price as Record<string, number>).$lte = filters.maxPrice;
    }
    if (filters.search) {
      // Substring match on title/description — MongoDB's $text only matches
      // whole words, which makes incremental "as you type" search look broken.
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      query.$or = [{ title: pattern }, { description: pattern }];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { listedAt: -1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      views: { views: -1 },
    };
    const sortBy = sortMap[filters.sort ?? 'newest'] ?? sortMap.newest;

    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ListingModel.find(query).skip(skip).limit(options.limit).sort(sortBy).populate(SELLER_POPULATE),
      ListingModel.countDocuments(query),
    ]);

    return { listings: docs.map(toEntity), total };
  }

  async findBySeller(sellerId: string, options: PaginationOptions): Promise<{ listings: Listing[]; total: number }> {
    const skip = (options.page - 1) * options.limit;
    const [docs, total] = await Promise.all([
      ListingModel.find({ sellerId }).skip(skip).limit(options.limit).sort({ listedAt: -1 }).populate(SELLER_POPULATE),
      ListingModel.countDocuments({ sellerId }),
    ]);
    return { listings: docs.map(toEntity), total };
  }

  async incrementViews(id: string): Promise<void> {
    await ListingModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  async updateStatus(id: string, status: ListingStatus): Promise<void> {
    await ListingModel.findByIdAndUpdate(id, { $set: { status } });
  }

  async updateRating(id: string, rating: number, _reviewCount: number): Promise<void> {
    const listing = await ListingModel.findById(id);
    if (!listing) return;
    const newCount = listing.reviewCount + 1;
    const newRating = (listing.rating * listing.reviewCount + rating) / newCount;
    await ListingModel.findByIdAndUpdate(id, { $set: { rating: newRating, reviewCount: newCount } });
  }
}
