import { Account, Transaction, AccountType } from '../types';
import { API_BASE_URL } from '../utils/apiConfig';

// Mock data representing what an open banking API might return
const mockAccounts: Account[] = [
  { id: 'acc_1', name: 'Main Chequing', type: AccountType.CHECKING, balance: 17000.00, currency: 'AUD' },
  { id: 'acc_2', name: 'High-Yield Savings', type: AccountType.SAVINGS, balance: 1361.25, currency: 'AUD' },
  { id: 'acc_3', name: 'Travel Rewards Card', type: AccountType.CREDIT_CARD, balance: 855.90, currency: 'AUD' },
];

const mockTransactions: Transaction[] = [
  // --- July 2024 ---
  { id: 'txn_1', accountId: 'acc_1', description: 'Grocery Store', amount: -75.40, date: '2024-07-28', category: 'Groceries' },
  { id: 'txn_2', accountId: 'acc_1', description: 'Monthly Salary', amount: 3200.00, date: '2024-07-27', category: 'Income' },
  { id: 'txn_3', accountId: 'acc_1', description: 'Petrol Station', amount: -45.00, date: '2024-07-26', category: 'Transport' },
  { id: 'txn_4', accountId: 'acc_3', description: 'Restaurant Dinner', amount: -120.00, date: '2024-07-25', category: 'Food & Dining' },
  { id: 'txn_5', accountId: 'acc_2', description: 'Interest Payment', amount: 25.50, date: '2024-07-25', category: 'Income' },
  { id: 'txn_13', accountId: 'acc_1', description: 'Freelance Project Payment', amount: 750.00, date: '2024-07-25', category: 'Income' },
  { id: 'txn_6', accountId: 'acc_1', description: 'Online Shopping', amount: -210.80, date: '2024-07-24', category: 'Shopping' },
  { id: 'txn_7', accountId: 'acc_3', description: 'Coffee Shop', amount: -5.75, date: '2024-07-23', category: 'Food & Dining' },
  { id: 'txn_8', accountId: 'acc_1', description: 'Gym Membership', amount: -50.00, date: '2024-07-22', category: 'Health' },
  { id: 'txn_9', accountId: 'acc_1', description: 'Internet Bill', amount: -65.00, date: '2024-07-21', category: 'Utilities' },
  { id: 'txn_50', accountId: 'acc_3', description: 'Dinner with Friends', amount: -95.00, date: '2024-07-20', category: 'Food & Dining' },
  { id: 'txn_12', accountId: 'acc_3', description: 'Movie Tickets', amount: -30.00, date: '2024-07-19', category: 'Entertainment' },
  { id: 'txn_40', accountId: 'acc_1', description: 'Stan Subscription', amount: -12.99, date: '2024-07-16', category: 'Subscriptions' },
  { id: 'txn_14', accountId: 'acc_1', description: 'Netflix Subscription', amount: -16.99, date: '2024-07-15', category: 'Subscriptions' },
  { id: 'txn_15', accountId: 'acc_1', description: 'Woolworths Groceries', amount: -112.30, date: '2024-07-14', category: 'Groceries' },
  { id: 'txn_16', accountId: 'acc_3', description: 'Phone Bill', amount: -45.00, date: '2024-07-12', category: 'Utilities' },
  { id: 'txn_51', accountId: 'acc_3', description: 'Uber Eats', amount: -45.50, date: '2024-07-11', category: 'Food & Dining' },
  { id: 'txn_17', accountId: 'acc_1', description: 'BP Petrol', amount: -60.10, date: '2024-07-10', category: 'Transport' },
  { id: 'txn_18', accountId: 'acc_1', description: 'Lunch with Friends', amount: -85.50, date: '2024-07-06', category: 'Food & Dining' },
  { id: 'txn_19', accountId: 'acc_1', description: 'Monthly Rent', amount: -1800.00, date: '2024-07-01', category: 'Housing' },

  // --- June 2024 ---
  { id: 'txn_20', accountId: 'acc_1', description: 'Monthly Salary', amount: 3200.00, date: '2024-06-27', category: 'Income' },
  { id: 'txn_21', accountId: 'acc_2', description: 'Interest Payment', amount: 24.80, date: '2024-06-25', category: 'Income' },
  { id: 'txn_22', accountId: 'acc_1', description: 'Gym Membership', amount: -50.00, date: '2024-06-22', category: 'Health' },
  { id: 'txn_23', accountId: 'acc_1', description: 'Internet Bill', amount: -65.00, date: '2024-06-21', category: 'Utilities' },
  { id: 'txn_52', accountId: 'acc_3', description: 'Weekend Brunch', amount: -65.00, date: '2024-06-19', category: 'Food & Dining' },
  { id: 'txn_24', accountId: 'acc_1', description: 'Coles Groceries', amount: -95.60, date: '2024-06-18', category: 'Groceries' },
  { id: 'txn_41', accountId: 'acc_1', description: 'Stan Subscription', amount: -12.99, date: '2024-06-16', category: 'Subscriptions' },
  { id: 'txn_25', accountId: 'acc_1', description: 'Netflix Subscription', amount: -16.99, date: '2024-06-15', category: 'Subscriptions' },
  { id: 'txn_26', accountId: 'acc_3', description: 'Phone Bill', amount: -45.00, date: '2024-06-12', category: 'Utilities' },
  { id: 'txn_27', accountId: 'acc_1', description: 'Shell Petrol', amount: -55.70, date: '2024-06-10', category: 'Transport' },
  { id: 'txn_28', accountId: 'acc_3', description: 'Amazon Purchase', amount: -150.99, date: '2024-06-08', category: 'Shopping' },
  { id: 'txn_53', accountId: 'acc_3', description: 'Friday Drinks', amount: -75.00, date: '2024-06-07', category: 'Food & Dining' },
  { id: 'txn_29', accountId: 'acc_1', description: 'Monthly Rent', amount: -1800.00, date: '2024-06-01', category: 'Housing' },

  // --- May 2024 ---
  { id: 'txn_30', accountId: 'acc_1', description: 'Monthly Salary', amount: 3200.00, date: '2024-05-27', category: 'Income' },
  { id: 'txn_31', accountId: 'acc_2', description: 'Interest Payment', amount: 24.10, date: '2024-05-25', category: 'Income' },
  { id: 'txn_32', accountId: 'acc_1', description: 'Gym Membership', amount: -50.00, date: '2024-05-22', category: 'Health' },
  { id: 'txn_33', accountId: 'acc_1', description: 'Internet Bill', amount: -65.00, date: '2024-05-21', category: 'Utilities' },
  { id: 'txn_34', accountId: 'acc_1', description: 'Weekend Groceries', amount: -130.25, date: '2024-05-19', category: 'Groceries' },
  { id: 'txn_42', accountId: 'acc_1', description: 'Stan Subscription', amount: -12.99, date: '2024-05-16', category: 'Subscriptions' },
  { id: 'txn_35', accountId: 'acc_1', description: 'Netflix Subscription', amount: -16.99, date: '2024-05-15', category: 'Subscriptions' },
  { id: 'txn_54', accountId: 'acc_1', description: 'Pub Meal', amount: -55.00, date: '2024-05-14', category: 'Food & Dining' },
  { id: 'txn_36', accountId: 'acc_3', description: 'Phone Bill', amount: -45.00, date: '2024-05-12', category: 'Utilities' },
  { id: 'txn_37', accountId: 'acc_1', description: '7-Eleven Fuel', amount: -50.00, date: '2024-05-09', category: 'Transport' },
  { id: 'txn_38', accountId: 'acc_3', description: 'Takeaway Pizza', amount: -42.50, date: '2024-05-05', category: 'Food & Dining' },
  { id: 'txn_39', accountId: 'acc_1', description: 'Monthly Rent', amount: -1800.00, date: '2024-05-01', category: 'Housing' },
];


// Simulate API call with a delay
const simulateApiCall = <T,>(data: T): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, 800);
  });
};

/**
 * Fetches financial data. If a Basiq connection exists (i.e., basiqUserId is in localStorage),
 * it fetches real data from the backend. Otherwise, it returns mock data.
 */
const fetchFinancialData = async (): Promise<{ accounts: Account[], transactions: Transaction[] }> => {
    const basiqUserId = localStorage.getItem('basiqUserId');

    if (basiqUserId) {
        try {
            console.log(`Basiq connection found for user ${basiqUserId}. Fetching real data...`);
            const backendUrl = `${API_BASE_URL}/basiq-data/${basiqUserId}`;
            const response = await fetch(backendUrl);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Server returned a non-OK status' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const sortedTransactions = data.transactions.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return { accounts: data.accounts, transactions: sortedTransactions };

        } catch (error) {
            console.error('Failed to fetch real data from Basiq.', error);
            // Do NOT fall back to mock data if a connection exists but the fetch fails.
            // Propagate the error to the UI to show a proper error message.
            throw error;
        }
    } else {
        // No connection found, use mock data
        console.log("No Basiq connection found, using mock data.");
        const sortedMockTransactions = mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return simulateApiCall({ accounts: mockAccounts, transactions: sortedMockTransactions });
    }
}

export const getAccounts = async (): Promise<Account[]> => {
  const { accounts } = await fetchFinancialData();
  return accounts;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { transactions } = await fetchFinancialData();
  return transactions;
};

export const getCreditScore = (): Promise<number> => {
    // In a real app, this would be a secure API call.
    // For the demo, we'll return a mock score based on the Australian system.
    const mockScore = 765; 
    return simulateApiCall(mockScore);
}

/**
 * Calls the backend server to create a new Basiq consent session.
 * @param userEmail The email of the user to associate with the Basiq session.
 * @returns An object containing the consent URL for the Basiq redirect flow.
 */
export const initiateBankConnection = async (userEmail: string): Promise<{ consentUrl: string; userId: string; }> => {
  const backendUrl = `${API_BASE_URL}/create-consent-session`;
  console.log(`[BANKING SERVICE] Attempting to POST to backend: ${backendUrl}`);

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail }),
    });

    // --- Robust Error Handling ---
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      } catch (jsonError) {
        const responseText = await response.text().catch(() => "Could not read response text.");
        console.error("[BANKING SERVICE] Non-JSON error response from server:", responseText);
        throw new Error(`The server returned an unexpected response. Please check the backend logs. Status: ${response.status}`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("[BANKING SERVICE] Received non-JSON response from server:", responseText);
        throw new Error("Received an invalid response from the server. It might be an HTML error page. Check the backend server logs for details.");
    }
    // --- End Robust Error Handling ---

    const data = await response.json();

    // --- Debugging ---
    console.log("[BANKING SERVICE] Received data from server:", JSON.stringify(data, null, 2));

    if (!data.consentUrl) {
        throw new Error("Consent URL not found in server response. Check the browser console logs for the full server response object.");
    }
    
    console.log("[BANKING SERVICE] Successfully received consent URL from backend.");
    return data;

  } catch (error) {
    console.error(`[BANKING SERVICE] Fetch to ${backendUrl} failed:`, error);
    // Re-throw the error to be handled by the UI component
    throw error;
  }
};