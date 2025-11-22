import { User } from '../types';

interface CheckoutSessionOptions {
  priceId?: string;
  regionOverride?: string;
}

/**
 * Calls the Vercel serverless function to create a Stripe Checkout session.
 * @param user The current authenticated user.
 * @returns An object containing the Stripe checkout session URL.
 */
export const createCheckoutSession = async (
  user: User,
  options?: CheckoutSessionOptions
): Promise<{ url: string }> => {
  const response = await fetch(`/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      userEmail: user.email,
      region: options?.regionOverride || user.region,
      referrerId: user.referredBy,
      priceId: options?.priceId,
    }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Server error: ${response.status}`);
    } catch {
      const responseText = await response.text().catch(() => "Could not read response text.");
      console.error("Non-JSON error response from server:", responseText);
      throw new Error(`Unexpected server response. Status: ${response.status}`);
    }
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  return data; // { url }
};
