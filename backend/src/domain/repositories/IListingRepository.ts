import type { Listing, Category, Condition, ListingStatus } from '../entities/Listing';
import type { PaginationOptions } from './IUserRepository';

export interface ListingFilters {
  category?: Category;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sellerId?: string;
  status?: ListingStatus;
  search?: string;
}

export interface IListingRepository {
  findById(id: string): Promise<Listing | null>;
  create(data: Omit<Listing, 'id' | 'listedAt' | 'updatedAt'>): Promise<Listing>;
  update(id: string, data: Partial<Listing>): Promise<Listing | null>;
  delete(id: string): Promise<boolean>;
  findAll(filters: ListingFilters, options: PaginationOptions): Promise<{ listings: Listing[]; total: number }>;
  findBySeller(sellerId: string, options: PaginationOptions): Promise<{ listings: Listing[]; total: number }>;
  incrementViews(id: string): Promise<void>;
  updateStatus(id: string, status: ListingStatus): Promise<void>;
  updateRating(id: string, rating: number, reviewCount: number): Promise<void>;
}
