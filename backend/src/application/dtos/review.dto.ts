import { z } from 'zod';

export const CreateReviewDto = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
});

export type CreateReviewDtoType = z.infer<typeof CreateReviewDto>;
