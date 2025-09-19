// src/services/BankingService.ts
import { Account, Transaction, AccountType } from '../types';

// --- Mock data for demo / no Basiq connection ---
const mockAccounts: Account[] = [
  { id: 'acc_1', name: 'Main Chequing', type: AccountType.CHECKING, balance: 17000.00, currency: 'AUD' },
  { id: 'acc_2', name: 'High-Yield Savings', type: AccountType.SAVINGS, balance: 1361.25, currency: 'AUD' },
  { id: 'acc_3', name: 'Travel Rewards Card', type: AccountType.CREDIT_CARD, balance: 855.90, currency: 'AUD' },
  { id: 'acc_4', name: 'Home Loan', type: AccountType.LOAN, balance: 700000.00, currency: 'AUD' },
];

const mockTransactions: Transaction[] = [
  { id: 'txn_1', accountId: 'acc_1', description: 'Grocery Store', amount: -75.40, date: '2024-07-28', category: 'Groceries' },
  { id: 'txn_2', accountId: 'acc_1', description: 'Monthly Salary', amount: 3200.00, date: '2024-07-27', category: 'Income' },
  { id: 'txn_3', accountId: 'acc_1', description: 'Petrol Station', amount: -45.00, date: '2024-07-26', category: 'Transport' },
  { id: 'txn_4', accountId: 'acc_3', description: 'Restaurant Dinner', amount: -120.00, date: '2024-07-25', category: 'Food & Dining' },
  { id: 'txn_5', accountId: 'acc_2', description: 'Interest Payment', amount: 25.50, date: '2024-07-25', category: 'Income' },
  { id: 'txn_6', accountId: 'acc_1', description: 'Online Shopping', amount: -210.80, date: '2024-07-24', category: 'Shopping' },
  { id: 'txn_7', accountId: 'acc_3', description: 'Coffee Shop', amount: -5.75, date: '2024-07-23', category: 'Food & Dining' },
];

// Utility: fake delay for mock data
const simulateApiCall = <T,>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), 600));

// --- Core financial fetch ---
const fetchFinancialData = async (): Promise<{ accounts: Account[], transactions: Transaction[] }> => {
  const basiqUserId = localStorage.getItem('basiqUserId');

  if (basiqUserId) {
    try {
      console.log(`[BANKING SERVICE] Fetching Basiq data for user ${basiqUserId}`);
      const response = await fetch(`/api/basiq-data?userId=${basiqUserId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server returned a non-OK status' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sortedTransactions = data.transactions.sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return { accounts: data.accounts, transactions: sortedTransactions };
    } catch (error) {
      console.error('[BANKING SERVICE] Failed to fetch Basiq data:', error);
      throw error; // propagate to UI
    }
  }

  // --- No connection found, return mock data ---
  console.log('[BANKING SERVICE] No Basiq connection found, using mock data.');
  const sortedMockTransactions = mockTransactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return simulateApiCall({ accounts: mockAccounts, transactions: sortedMockTransactions });
};

// --- Public exports ---
export const getAccounts = async (): Promise<Account[]> => {
  const { accounts } = await fetchFinancialData();
  return accounts;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { transactions } = await fetchFinancialData();
  return transactions;
};

export const getCreditScore = (): Promise<number> => {
  // Mock credit score for demo
  const mockScore = 765;
  return simulateApiCall(mockScore);
};

// --- Bank connection (Basiq consent) ---
export const initiateBankConnection = async (
  userEmail: string
): Promise<{ consentUrl: string; userId: string }> => {
  console.log('[BANKING SERVICE] Initiating consent session for:', userEmail);

  try {
    const response = await fetch('/api/create-consent-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.consentUrl) throw new Error('Consent URL missing in server response');

    console.log('[BANKING SERVICE] Consent session created successfully:', data.consentUrl);
    return data;
  } catch (error) {
    console.error('[BANKING SERVICE] Error creating consent session:', error);
    throw error;
  }
};
