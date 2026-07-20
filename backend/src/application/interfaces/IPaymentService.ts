export interface CreatedPaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentWebhookEvent {
  type: 'succeeded' | 'failed' | 'ignored';
  paymentIntentId: string;
  metadata: Record<string, string>;
}

/**
 * Payment processing port. The concrete adapter (Stripe) never has its raw
 * card data touch our server — the browser talks to the provider directly via
 * its own client-side SDK using only the client secret this returns.
 */
export interface IPaymentService {
  isConfigured(): boolean;
  createPaymentIntent(amountCents: number, currency: string, metadata: Record<string, string>): Promise<CreatedPaymentIntent>;
  /** Verifies the webhook signature and normalises the event; throws if the signature is invalid. */
  constructWebhookEvent(rawBody: Buffer, signature: string): PaymentWebhookEvent;
}
