import { loadStripe } from '@stripe/stripe-js';

// The publishable key is designed to be exposed to the browser — it can only
// create tokens/confirm payments, never charge or refund on its own.
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
