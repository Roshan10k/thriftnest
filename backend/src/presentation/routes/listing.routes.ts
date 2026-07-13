import { Router } from 'express';
import { ListingController } from '../controllers/ListingController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadRateLimit } from '../middleware/rateLimit';
import { ListingService } from '../../application/services/ListingService';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { MongoNotificationRepository } from '../../infrastructure/repositories/MongoNotificationRepository';
import { MongoWishlistRepository } from '../../infrastructure/repositories/MongoWishlistRepository';
import { LocalStorageService } from '../../infrastructure/services/LocalStorageService';

const router = Router();

const service = new ListingService(
  new MongoListingRepository(),
  new LocalStorageService(),
  new MongoNotificationRepository(),
  new MongoWishlistRepository(),
);
const ctrl = new ListingController(service);

router.get('/', optionalAuthenticate, ctrl.browse);
router.get('/my', authenticate, ctrl.myListings);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, uploadRateLimit, upload.array('images', 8), ctrl.create);
router.patch('/:id', authenticate, upload.array('images', 8), ctrl.update);
router.delete('/:id', authenticate, ctrl.delete);
router.patch('/:id/status', authenticate, ctrl.updateStatus);

export default router;
