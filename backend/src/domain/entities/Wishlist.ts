export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
  priceAtAdd: number;
  priceAlertEnabled: boolean;
  addedAt: Date;
}
