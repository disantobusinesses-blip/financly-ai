import { User } from '../types';
import { API_BASE_URL } from '../utils/apiConfig';

/**
 * Calls the backend to create a Stripe Checkout session.
 * @param user The current authenticated user.
 * @returns An object containing the Stripe checkout session URL.
 */
export const createCheckoutSession = async (user: User): Promise<{ url: string }> => {
  const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, userEmail: user.email, region: user.region }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Server error: ${response.status}`);
    } catch (jsonError) {
      const responseText = await response.text().catch(() => "Could not read response text.");
      console.error("Non-JSON error response from server:", responseText);
      throw new Error(`The server returned an unexpected response. Please check if the backend is running correctly. Status: ${response.status}`);
    }
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const responseText = await response.text();
    console.error("Received non-JSON response from server:", responseText);
    throw new Error("Received an invalid response from the server. It might be an HTML error page. Check the backend server logs for details.");
  }

  const data = await response.json();
  if (data.error || !data.url) {
    throw new Error(data.error?.message || 'Could not create payment session.');
  }

  return data;
};
