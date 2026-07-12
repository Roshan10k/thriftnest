import { z } from 'zod';

// FormData sends booleans as "true"/"false" strings — coerce them properly
const coercedBoolean = z
  .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
  .default(false);

export const CreateListingDto = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(1000),
  price: z.coerce.number().positive().min(50),
  originalPrice: z.coerce.number().positive().optional(),
  category: z.enum([
    'clothing', 'electronics', 'books', 'furniture', 'sports',
    'toys', 'art', 'accessories', 'appliances', 'other',
  ]),
  subcategory: z.string().optional(),
  condition: z.enum(['brand-new', 'like-new', 'good', 'fair', 'for-parts']),
  location: z.string().min(2),
  negotiable: coercedBoolean,
  deliveryAvailable: coercedBoolean,
  pickupAvailable: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
    .default(true),
  deliveryFee: z.coerce.number().nonnegative().optional(),
});

export const UpdateListingDto = CreateListingDto.partial();

export const ListingQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  category: z.string().optional(),
  condition: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  location: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['price-asc', 'price-desc', 'newest', 'views']).default('newest'),
  sellerId: z.string().optional(),
});

export type CreateListingDtoType = z.infer<typeof CreateListingDto>;
export type UpdateListingDtoType = z.infer<typeof UpdateListingDto>;
export type ListingQueryDtoType = z.infer<typeof ListingQueryDto>;
