import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';
import { MongoWishlistRepository } from '../../infrastructure/repositories/MongoWishlistRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { AppError } from '../../application/errors/AppError';

const router = Router();
const repo = new MongoWishlistRepository();
const listingRepo = new MongoListingRepository();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await repo.findByUser(req.user!.userId);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.post('/:listingId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listing = await listingRepo.findById(req.params.listingId);
    if (!listing) throw AppError.notFound('Listing');

    const existing = await repo.findByUserAndListing(req.user!.userId, req.params.listingId);
    if (existing) {
      res.status(409).json({ success: false, message: 'Already in wishlist' });
      return;
    }

    const item = await repo.add({
      userId: req.user!.userId,
      listingId: req.params.listingId,
      priceAtAdd: listing.price,
      priceAlertEnabled: false,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await repo.remove(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/:id/price-alert', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body as { enabled: boolean };
    await repo.setPriceAlert(req.params.id, req.user!.userId, enabled);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
