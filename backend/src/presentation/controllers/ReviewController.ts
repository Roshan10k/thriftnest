import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { ReviewService } from '../../application/services/ReviewService';
import { CreateReviewDto } from '../../application/dtos/review.dto';

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateReviewDto.parse(req.body);
      const review = await this.reviewService.create(req.user!.userId, dto);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  };

  forSeller = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sellerId } = req.params;
      if (!/^[a-f\d]{24}$/i.test(sellerId)) {
        res.json({ success: true, data: { reviews: [], total: 0 } });
        return;
      }
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await this.reviewService.getSellerReviews(sellerId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  forListing = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { listingId } = req.params;
      if (!/^[a-f\d]{24}$/i.test(listingId)) {
        res.json({ success: true, data: { reviews: [], total: 0 } });
        return;
      }
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await this.reviewService.getListingReviews(listingId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
