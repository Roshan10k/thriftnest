import type { WishlistItem } from '../entities/Wishlist';

export interface IWishlistRepository {
  findByUser(userId: string): Promise<WishlistItem[]>;
  findByUserAndListing(userId: string, listingId: string): Promise<WishlistItem | null>;
  add(data: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<WishlistItem>;
  remove(id: string, userId: string): Promise<boolean>;
  setPriceAlert(id: string, userId: string, enabled: boolean): Promise<void>;
  findWithPriceAlertForListing(listingId: string): Promise<WishlistItem[]>;
}
