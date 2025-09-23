// src/services/BankingService.ts
import { Account, Transaction } from "../types";
import { demoAccounts, demoTransactions } from "../demo/demoData";

export class BankingService {
  static async getAccounts(): Promise<Account[]> {
    // For demo, return local accounts
    return demoAccounts;
  }

  static async getTransactions(): Promise<Transaction[]> {
    // For demo, return local transactions
    return demoTransactions;
  }
}

/** Used by Header.tsx to initiate Basiq connection */
export async function initiateBankConnection(email: string): Promise<{
  consentUrl: string;
  userId: string;
}> {
  const res = await fetch("/api/create-consent-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
