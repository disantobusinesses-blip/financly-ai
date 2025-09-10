import { API_BASE_URL } from '../utils/apiConfig';

/**
 * Calls the backend server to create a new Plaid Link token.
 * In a real app, you would use the `react-plaid-link` component with this token.
 * @returns An object containing the link_token.
 */
export const initiatePlaidConnection = async (userId: string): Promise<{ link_token: string; }> => {
  const backendUrl = `${API_BASE_URL}/plaid-create-link-token`;

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Server returned a non-OK status' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.link_token) {
        throw new Error("Link token not found in server response.");
    }

    // In a real app, you would now initialize Plaid Link with this token.
    // For this demo, we'll just log it.
    console.log("Received mock Plaid Link token:", data.link_token);
    alert("Plaid connection initiated (mock). Check console for link token.");

    return data;
  } catch (error) {
    console.error('Error initiating Plaid connection:', error);
    // Re-throw the error to be handled by the UI component
    throw error;
  }
};