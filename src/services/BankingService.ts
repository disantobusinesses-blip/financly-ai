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

export async function initiateBankConnection(
  email: string,
  accessToken?: string
): Promise<{ authUrl: string; sessionId?: string; expiresAt?: string }> {
  const res = await fetch("/api/create-consent-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = "Consent session failed";
    try {
      const parsed = JSON.parse(text);
      message = parsed?.error || text || message;
    } catch (err) {
      message = text || message;
    }
    throw new Error(message);
  }

  const data = await res.json();
  const authUrl = data.auth_url || data.authUrl;
  if (!authUrl) {
    throw new Error("Invalid consent response: missing auth_url");
  }

  // Store identifiers so callback or polling can finalise the connection
  try {
    if (data.session_id) {
      localStorage.setItem("fiskilSessionId", data.session_id);
    }
    localStorage.setItem("basiqConnectionStatus", "pending");
  } catch (err) {
    console.warn("Unable to persist pending consent metadata", err);
  }

  return {
    authUrl,
    sessionId: data.session_id,
    expiresAt: data.expires_at,
  };
}
