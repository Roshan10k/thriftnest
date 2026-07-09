export type Category =
  | 'clothing'
  | 'electronics'
  | 'books'
  | 'furniture'
  | 'sports'
  | 'toys'
  | 'art'
  | 'accessories'
  | 'appliances'
  | 'other';

export type Condition = 'brand-new' | 'like-new' | 'good' | 'fair' | 'for-parts';
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'paused' | 'removed' | 'flagged';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category;
  subcategory?: string;
  condition: Condition;
  images: string[];
  sellerId: string;
  location: string;
  views: number;
  status: ListingStatus;
  negotiable: boolean;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryFee?: number;
  rating: number;
  reviewCount: number;
  flagCount: number;
  listedAt: Date;
  updatedAt: Date;
}
