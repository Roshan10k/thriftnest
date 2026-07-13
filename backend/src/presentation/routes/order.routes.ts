import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticate } from '../middleware/auth';
import { OrderService } from '../../application/services/OrderService';
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { MongoTransactionRepository } from '../../infrastructure/repositories/MongoTransactionRepository';
import { MongoNotificationRepository } from '../../infrastructure/repositories/MongoNotificationRepository';
import { MongoMessageRepository } from '../../infrastructure/repositories/MongoMessageRepository';
import { NodemailerEmailService } from '../../infrastructure/services/NodemailerEmailService';

const router = Router();

const service = new OrderService(
  new MongoOrderRepository(),
  new MongoListingRepository(),
  new MongoTransactionRepository(),
  new MongoNotificationRepository(),
  new NodemailerEmailService(),
  new MongoMessageRepository(),
);
const ctrl = new OrderController(service);

router.use(authenticate);
router.post('/', ctrl.create);
router.get('/my', ctrl.myOrders);
router.get('/seller', ctrl.sellerOrders);
router.get('/:id', ctrl.getById);
router.patch('/:id/status', ctrl.updateStatus);

export default router;
