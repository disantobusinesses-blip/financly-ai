// /src/services/BankingService.ts
// Frontend initiator for consent; live-only data fetch helpers.
// Accepts both backend response shapes:
// - Old: { consentUrl, userId }
// - New: { redirect_url, end_user_id }

import { Account, Transaction } from "../types";

export class BankingService {
  static getStoredUserId(): string | null {
    // Keeping the existing key for backwards compatibility
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

export async function initiateBankConnection(
  email: string,
  accessToken?: string
): Promise<{ consentUrl: string; userId: string }> {
  const res = await fetch("/api/create-consent-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ email }),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // non-json error response
    if (!res.ok) throw new Error(`Consent session failed: ${text}`);
    throw new Error("Consent session returned invalid JSON");
  }

  if (!res.ok) {
    throw new Error(`Consent session failed: ${data?.details || data?.error || text}`);
  }

  // Accept both new + old response shapes
  const consentUrl: string | undefined = data?.redirect_url ?? data?.consentUrl;
  const userId: string | undefined = data?.end_user_id ?? data?.userId;

  if (!consentUrl || !userId) {
    throw new Error("Invalid consent response (missing consentUrl/userId)");
  }

  // Store identifiers so callback or polling can finalise the connection
  try {
    // Keep existing keys to avoid breaking other code paths
    localStorage.setItem("basiqPendingUserId", userId);
    localStorage.setItem("basiqConnectionStatus", "pending");
  } catch (err) {
    console.warn("Unable to persist pending user id", err);
  }

  // Store userId so we can fetch data immediately after redirect
  BankingService.setStoredUserId(userId);

  return { consentUrl, userId };
}
