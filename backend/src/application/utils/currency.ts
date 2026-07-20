// Stripe does not support NPR (Nepalese Rupee) as a chargeable currency, so
// test-mode card charges are placed in USD using a fixed illustrative
// conversion rate. This only affects the amount sent to Stripe for the test
// charge — every price, fee, and total shown to the user, and all business
// logic (order totals, platform fee, refunds), stays in NPR throughout the
// rest of the app. No real money moves in test mode regardless of currency.
const NPR_PER_USD = 133;

export function nprToUsdCents(nprAmount: number): number {
  return Math.round((nprAmount / NPR_PER_USD) * 100);
}
