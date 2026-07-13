import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { authenticate } from '../middleware/auth';
import { ReviewService } from '../../application/services/ReviewService';
import { MongoReviewRepository } from '../../infrastructure/repositories/MongoReviewRepository';
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';

const router = Router();

const service = new ReviewService(
  new MongoReviewRepository(),
  new MongoOrderRepository(),
  new MongoUserRepository(),
  new MongoListingRepository(),
);
const ctrl = new ReviewController(service);

router.post('/', authenticate, ctrl.create);
router.get('/seller/:sellerId', ctrl.forSeller);
router.get('/listing/:listingId', ctrl.forListing);

export default router;
