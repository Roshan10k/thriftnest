import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticate, requireAdmin } from '../middleware/auth';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository';
import { MongoTransactionRepository } from '../../infrastructure/repositories/MongoTransactionRepository';
import { MongoActivityLogRepository } from '../../infrastructure/repositories/MongoActivityLogRepository';
import { AppError } from '../../application/errors/AppError';

const router = Router();
router.use(authenticate, requireAdmin);

const userRepo = new MongoUserRepository();
const listingRepo = new MongoListingRepository();
const orderRepo = new MongoOrderRepository();
const txRepo = new MongoTransactionRepository();
const logRepo = new MongoActivityLogRepository();

// Users
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await userRepo.findAll({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.userId) {
      return next(AppError.badRequest('You cannot suspend your own account'));
    }
    await userRepo.update(req.params.id, { suspended: true });
    // Immediately invalidate any active session the suspended user holds.
    await userRepo.incrementTokenVersion(req.params.id);
    res.json({ success: true, message: 'User suspended' });
  } catch (err) { next(err); }
});

router.patch('/users/:id/unban', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userRepo.update(req.params.id, { suspended: false });
    res.json({ success: true, message: 'User reinstated' });
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.userId) {
      return next(AppError.badRequest('You cannot delete your own account'));
    }
    await userRepo.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Listings
router.get('/listings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await listingRepo.findAll({}, { page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.patch('/listings/:id/remove', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await listingRepo.updateStatus(req.params.id, 'removed');
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Orders
router.get('/orders', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await orderRepo.findAll({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Resolve a disputed order: refund it and return the listing to the market.
router.patch('/orders/:id/resolve', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await orderRepo.findById(req.params.id);
    if (!order) throw AppError.notFound('Order');
    await orderRepo.updateStatus(req.params.id, 'refunded');
    await listingRepo.updateStatus(order.listingId, 'active');
    res.json({ success: true, message: 'Dispute resolved and order refunded' });
  } catch (err) { next(err); }
});

// Transactions
router.get('/transactions', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await txRepo.findAll({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Activity Logs
router.get('/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const result = await logRepo.findAll({ page, limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
