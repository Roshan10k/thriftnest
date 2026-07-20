import Stripe from 'stripe';
import type { IPaymentService, CreatedPaymentIntent, PaymentWebhookEvent } from '../../application/interfaces/IPaymentService';

function getClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key);
}

export class StripePaymentService implements IPaymentService {
  isConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  }

  async createPaymentIntent(
    amountCents: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<CreatedPaymentIntent> {
    const intent = await getClient().paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      // allow_redirects: 'never' restricts this to payment methods that
      // confirm in-page (card) rather than ones that bounce the browser to a
      // hosted page and back (Link, Klarna, Cashapp, Amazon Pay). The frontend
      // never supplies a return_url, so a redirect-based method would strand
      // the buyer on a reload loop back to the checkout page with its React
      // state wiped — this keeps confirmPayment's `redirect: 'if_required'`
      // truthfully non-redirecting.
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });
    if (!intent.client_secret) throw new Error('Stripe did not return a client secret');
    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): PaymentWebhookEvent {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    // Throws if the signature doesn't match — the caller must treat that as
    // an untrusted/malformed request, not a valid payment event.
    const event = getClient().webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        type: event.type === 'payment_intent.succeeded' ? 'succeeded' : 'failed',
        paymentIntentId: intent.id,
        metadata: intent.metadata as Record<string, string>,
      };
    }
    return { type: 'ignored', paymentIntentId: '', metadata: {} };
  }
}
