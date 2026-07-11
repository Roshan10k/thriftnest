import { WishlistModel } from '../database/models/WishlistModel';
import type { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import type { WishlistItem } from '../../domain/entities/Wishlist';

function toEntity(doc: InstanceType<typeof WishlistModel>): WishlistItem {
  return doc.toJSON() as unknown as WishlistItem;
}

export class MongoWishlistRepository implements IWishlistRepository {
  async findByUser(userId: string): Promise<WishlistItem[]> {
    const docs = await WishlistModel.find({ userId }).sort({ addedAt: -1 }).populate('listingId');
    return docs.map(toEntity);
  }

  async findByUserAndListing(userId: string, listingId: string): Promise<WishlistItem | null> {
    const doc = await WishlistModel.findOne({ userId, listingId });
    return doc ? toEntity(doc) : null;
  }

  async add(data: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<WishlistItem> {
    const doc = await WishlistModel.create(data);
    return toEntity(doc);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    // Callers may pass either the wishlist entry's own id (e.g. from the
    // wishlist page) or the listing id (e.g. toggling the heart on a listing
    // card/detail page, which never fetched the entry id). Try both.
    const byEntryId = await WishlistModel.findOneAndDelete({ _id: id, userId });
    if (byEntryId) return true;
    const byListingId = await WishlistModel.findOneAndDelete({ listingId: id, userId });
    return !!byListingId;
  }

  async setPriceAlert(id: string, userId: string, enabled: boolean): Promise<void> {
    await WishlistModel.findOneAndUpdate({ _id: id, userId }, { $set: { priceAlertEnabled: enabled } });
  }

  async findWithPriceAlertForListing(listingId: string): Promise<WishlistItem[]> {
    const docs = await WishlistModel.find({ listingId, priceAlertEnabled: true });
    return docs.map(toEntity);
  }
}
