import type { Request, Response } from 'express';
import { OrderService } from '../../application/services/OrderService';
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository';
import { MongoListingRepository } from '../../infrastructure/repositories/MongoListingRepository';
import { MongoTransactionRepository } from '../../infrastructure/repositories/MongoTransactionRepository';
import { MongoNotificationRepository } from '../../infrastructure/repositories/MongoNotificationRepository';
import { MongoMessageRepository } from '../../infrastructure/repositories/MongoMessageRepository';
import { NodemailerEmailService } from '../../infrastructure/services/NodemailerEmailService';
import { StripePaymentService } from '../../infrastructure/services/StripePaymentService';

const orderService = new OrderService(
  new MongoOrderRepository(),
  new MongoListingRepository(),
  new MongoTransactionRepository(),
  new MongoNotificationRepository(),
  new NodemailerEmailService(),
  new MongoMessageRepository(),
  new StripePaymentService(),
);

// Mounted in app.ts with express.raw() BEFORE the global JSON body parser and
// CSRF middleware: Stripe's signature check needs the exact raw request
// bytes, and this endpoint is called by Stripe's servers directly, never a
// browser, so CSRF protection (which defends against browser-originated
// forged requests) does not apply here.
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ success: false, message: 'Missing Stripe signature' });
    return;
  }
  try {
    await orderService.handleStripeWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch {
    // Covers signature verification failures — respond 400 so Stripe treats
    // it as a bad request rather than retrying indefinitely as a server error.
    res.status(400).json({ success: false, message: 'Webhook error' });
  }
}
