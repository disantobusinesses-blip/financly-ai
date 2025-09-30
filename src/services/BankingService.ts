// src/services/BankingService.ts
import { Account, Transaction } from "../types";
import { demoAccounts, demoTransactions } from "../demo/demoData";

export class BankingService {
  static async getAccounts(userId?: string): Promise<Account[]> {
    if (!userId) {
      // Demo mode
      return demoAccounts;
    }

    const res = await fetch(`/api/basiq-data?userId=${userId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(userId?: string): Promise<Transaction[]> {
    if (!userId) {
      // Demo mode
      return demoTransactions;
    }

    const res = await fetch(`/api/basiq-data?userId=${userId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.transactions || [];
  }
}

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
