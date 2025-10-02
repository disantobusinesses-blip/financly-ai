// src/services/BankingService.ts
import { Account, Transaction } from "../types";

// ✅ Live only — no demo fallback
export class BankingService {
  static async getAccounts(userId: string): Promise<Account[]> {
    if (!userId) return [];
    const res = await fetch(`/api/basiq-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(userId: string): Promise<Transaction[]> {
    if (!userId) return [];
    const res = await fetch(`/api/basiq-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
    const data = await res.json();
    return data.transactions || [];
  }
}

// Still handles Basiq consent session
export async function initiateBankConnection(
  email: string
): Promise<{ consentUrl: string; userId: string }> {
  const res = await fetch("/api/create-consent-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
