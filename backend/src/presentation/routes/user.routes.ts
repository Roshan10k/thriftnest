import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { UserController } from '../controllers/UserController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { UserService } from '../../application/services/UserService';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository';
import { MongoWishlistRepository } from '../../infrastructure/repositories/MongoWishlistRepository';
import { MongoReviewRepository } from '../../infrastructure/repositories/MongoReviewRepository';
import { BcryptHashService } from '../../infrastructure/services/BcryptHashService';
import { LocalStorageService } from '../../infrastructure/services/LocalStorageService';

const router = Router();

const userRepo = new MongoUserRepository();
const listingRepo = new MongoListingRepository();
const orderRepo = new MongoOrderRepository();
const wishlistRepo = new MongoWishlistRepository();
const reviewRepo = new MongoReviewRepository();

const service = new UserService(
  userRepo,
  new LocalStorageService(),
  new BcryptHashService(),
);
const ctrl = new UserController(service);

router.get('/me', authenticate, ctrl.getMe);
router.patch('/me', authenticate, ctrl.updateProfile);
router.post('/me/avatar', authenticate, upload.single('avatar'), ctrl.updateAvatar);
router.post('/me/change-password', authenticate, ctrl.changePassword);

// Privacy: let a user export all of their own data as JSON (data portability).
router.get('/me/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = { page: 1, limit: 1000 };
    const [profile, listings, asBuyer, asSeller, wishlist, reviewsReceived] = await Promise.all([
      userRepo.findById(userId),
      listingRepo.findBySeller(userId, page),
      orderRepo.findByBuyer(userId, page),
      orderRepo.findBySeller(userId, page),
      wishlistRepo.findByUser(userId),
      reviewRepo.findBySeller(userId, page),
    ]);

    // Never include credentials/secrets in the export.
    const safeProfile = { ...(profile ?? {}) } as Record<string, unknown>;
    for (const k of ['passwordHash', 'passwordHistory', 'mfaSecret', 'backupCodes', 'passwordResetOtp', 'passwordResetExpiry']) {
      delete safeProfile[k];
    }

    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        profile: safeProfile,
        listings: listings.listings,
        orders: { asBuyer: asBuyer.orders, asSeller: asSeller.orders },
        wishlist,
        reviewsReceived: reviewsReceived.reviews,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/me', authenticate, ctrl.deleteAccount);
router.get('/:id', ctrl.getPublicProfile);

export default router;
