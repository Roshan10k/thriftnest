import type { IListingRepository, ListingFilters } from '../../domain/repositories/IListingRepository';
import type { IStorageService } from '../interfaces/IStorageService';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import type { CreateListingDtoType, UpdateListingDtoType, ListingQueryDtoType } from '../dtos/listing.dto';
import { AppError } from '../errors/AppError';
import type { ListingStatus } from '../../domain/entities/Listing';

export class ListingService {
  constructor(
    private readonly listingRepo: IListingRepository,
    private readonly storageService: IStorageService,
    private readonly notificationRepo: INotificationRepository,
    private readonly wishlistRepo: IWishlistRepository,
  ) {}

  async browse(query: ListingQueryDtoType, viewerId?: string) {
    const filters: ListingFilters = {
      category: query.category as ListingFilters['category'],
      condition: query.condition as ListingFilters['condition'],
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      location: query.location,
      search: query.search,
      sort: query.sort as ListingFilters['sort'],
      sellerId: query.sellerId,
      // Hide the viewer's own listings from the general feed, but only when they
      // aren't explicitly browsing a specific seller (e.g. a profile page).
      excludeSellerId: query.sellerId ? undefined : viewerId,
      status: 'active',
    };
    return this.listingRepo.findAll(filters, { page: query.page, limit: query.limit });
  }

  async getById(id: string, viewerId?: string) {
    const listing = await this.listingRepo.findById(id);
    if (!listing) throw AppError.notFound('Listing');
    if (listing.status === 'removed') throw AppError.notFound('Listing');
    if (viewerId !== listing.sellerId) {
      await this.listingRepo.incrementViews(id);
    }
    return listing;
  }

  async create(sellerId: string, dto: CreateListingDtoType, imageBuffers: Buffer[]) {
    let images: string[] = [];
    if (imageBuffers.length > 0) {
      const uploads = await this.storageService.uploadMultiple(imageBuffers, 'listings');
      images = uploads.map((u) => u.url);
    }

    return this.listingRepo.create({
      ...dto,
      sellerId,
      images,
      views: 0,
      status: 'active',
      rating: 0,
      reviewCount: 0,
      flagCount: 0,
    });
  }

  async update(id: string, sellerId: string, dto: UpdateListingDtoType, newImageBuffers?: Buffer[]) {
    const listing = await this.listingRepo.findById(id);
    if (!listing) throw AppError.notFound('Listing');
    if (listing.sellerId !== sellerId) throw AppError.forbidden();

    const updates: Partial<typeof listing> = { ...dto };

    if (newImageBuffers && newImageBuffers.length > 0) {
      const uploads = await this.storageService.uploadMultiple(newImageBuffers, 'listings');
      updates.images = [...listing.images, ...uploads.map((u) => u.url)];
    }

    if (dto.price !== undefined && dto.price !== listing.price) {
      await this.notifyPriceDrop(id, listing.price, dto.price);
    }

    return this.listingRepo.update(id, updates);
  }

  async delete(id: string, sellerId: string, isAdmin = false) {
    const listing = await this.listingRepo.findById(id);
    if (!listing) throw AppError.notFound('Listing');
    if (!isAdmin && listing.sellerId !== sellerId) throw AppError.forbidden();
    await this.listingRepo.updateStatus(id, 'removed');
  }

  async updateStatus(id: string, sellerId: string, status: ListingStatus) {
    const listing = await this.listingRepo.findById(id);
    if (!listing) throw AppError.notFound('Listing');
    if (listing.sellerId !== sellerId) throw AppError.forbidden();
    await this.listingRepo.updateStatus(id, status);
  }

  async getSellerListings(sellerId: string, page: number, limit: number) {
    return this.listingRepo.findBySeller(sellerId, { page, limit });
  }

  private async notifyPriceDrop(listingId: string, oldPrice: number, newPrice: number) {
    if (newPrice >= oldPrice) return;
    const wishlistItems = await this.wishlistRepo.findWithPriceAlertForListing(listingId);
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) return;

    await Promise.all(
      wishlistItems.map((item) =>
        this.notificationRepo.create({
          userId: item.userId,
          type: 'price-drop',
          title: 'Price Drop Alert',
          message: `"${listing.title}" dropped from NPR ${oldPrice.toLocaleString()} to NPR ${newPrice.toLocaleString()}`,
          link: `/listings/${listingId}`,
          read: false,
        }),
      ),
    );
  }
}
