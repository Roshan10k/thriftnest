import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticate } from '../middleware/auth';
import { MessageService } from '../../application/services/MessageService';
import { MongoMessageRepository } from '../../infrastructure/repositories/MongoMessageRepository';
import { MongoNotificationRepository } from '../../infrastructure/repositories/MongoNotificationRepository';

const router = Router();

const service = new MessageService(
  new MongoMessageRepository(),
  new MongoNotificationRepository(),
);
const ctrl = new MessageController(service);

router.use(authenticate);
router.get('/', ctrl.getConversations);
router.post('/', ctrl.getOrCreateConversation);
router.get('/:conversationId/messages', ctrl.getMessages);
router.post('/:conversationId/messages', ctrl.sendMessage);
router.post('/:conversationId/messages/:messageId/respond', ctrl.respondToOffer);

export default router;
