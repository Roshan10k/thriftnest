import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { authenticate } from '../middleware/auth';
import { MongoNotificationRepository } from '../../infrastructure/repositories/MongoNotificationRepository';

const router = Router();
const repo = new MongoNotificationRepository();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await repo.findByUser(req.user!.userId);
    const unread = await repo.countUnread(req.user!.userId);
    res.json({ success: true, data: { notifications, unread } });
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await repo.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await repo.markAllAsRead(req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await repo.delete(req.params.id, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
