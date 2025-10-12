// 🚀 REPLACEMENT FOR: /src/services/BankingService.ts
// Frontend initiator for consent; live-only data fetch helpers.

import { Account, Transaction } from "../types";

export class BankingService {
  static getStoredUserId(): string | null {
    return localStorage.getItem("basiqUserId");
  }

  static setStoredUserId(id: string) {
    localStorage.setItem("basiqUserId", id);
  }

  static clearStoredUserId() {
    localStorage.removeItem("basiqUserId");
  }

  static async getAccounts(userId?: string): Promise<Account[]> {
    const id = userId || this.getStoredUserId();
    if (!id) return [];
    const url = `/api/basiq-data?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(userId?: string): Promise<Transaction[]> {
    const id = userId || this.getStoredUserId();
    if (!id) return [];
    const url = `/api/basiq-data?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.transactions || [];
  }
}

export async function initiateBankConnection(email: string): Promise<{ consentUrl: string; userId: string }> {
  const res = await fetch("/api/create-consent-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Consent session failed: ${text}`);
  }

  const data = await res.json();
  if (!data?.consentUrl || !data?.userId) {
    throw new Error("Invalid consent response");
  }

  // Store userId so we can fetch data after redirect
  BankingService.setStoredUserId(data.userId);

  return data; // caller will set window.location.href = consentUrl
}