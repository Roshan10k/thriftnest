export interface Review {
  id: string;
  reviewerId: string;
  sellerId: string;
  listingId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
