// 🚀 Replacement for /src/services/BankingService.ts
// Frontend initiator for Fiskil Link; live-only data fetch helpers.

import { Account, Transaction } from "../types";

export class BankingService {
  static getStoredCustomerId(): string | null {
    return localStorage.getItem("fiskilCustomerId");
  }

  static setStoredCustomerId(id: string) {
    localStorage.setItem("fiskilCustomerId", id);
  }

  static clearStoredCustomerId() {
    localStorage.removeItem("fiskilCustomerId");
  }

  static async getAccounts(customerId?: string): Promise<Account[]> {
    const id = customerId || this.getStoredCustomerId();
    if (!id) return [];
    const url = `/api/fiskil-data?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(customerId?: string): Promise<Transaction[]> {
    const id = customerId || this.getStoredCustomerId();
    if (!id) return [];
    const url = `/api/fiskil-data?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.transactions || [];
  }
}

export async function initiateBankConnection(
  email: string,
  accessToken?: string
): Promise<{ consentUrl?: string; linkUrl?: string; userId?: string; customerId: string }> {
  const res = await fetch("/api/start-fiskil-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Link session failed: ${text}`);
  }

  const data = await res.json();
  if (!data?.linkUrl || !(data?.customerId || data?.userId)) {
    throw new Error("Invalid link response");
  }

  const customerId = data.customerId || data.userId;

  // Store identifiers so callback or polling can finalise the connection
  try {
    localStorage.setItem("fiskilPendingCustomerId", customerId);
    localStorage.setItem("fiskilConnectionStatus", "pending");
  } catch (err) {
    console.warn("Unable to persist pending Fiskil customer id", err);
  }

  // Store userId so we can fetch data immediately after redirect
  BankingService.setStoredCustomerId(customerId);

  return { ...data, customerId };
}
