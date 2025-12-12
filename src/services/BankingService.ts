// src/services/BankingService.ts
// Fiskil frontend service: create consent session + fetch data + refresh transactions

import { Account, Transaction } from "../types";

const CONSENT_ENDPOINT = "/api/create-consent-session";
const DATA_ENDPOINT = "/api/fiskil-data";
const REFRESH_ENDPOINT = "/api/fiskil-refresh-transactions";

// Keep these keys for backward compatibility (so other components don’t break)
const LS_USER_ID = "basiqUserId";
const LS_PENDING_USER_ID = "basiqPendingUserId";
const LS_CONNECTION_STATUS = "basiqConnectionStatus";

export class BankingService {
  static getStoredUserId(): string | null {
    return localStorage.getItem(LS_USER_ID);
  }

  static setStoredUserId(id: string) {
    localStorage.setItem(LS_USER_ID, id);
  }

  static clearStoredUserId() {
    localStorage.removeItem(LS_USER_ID);
  }

  static async getAccounts(userId?: string): Promise<Account[]> {
    const id = userId || this.getStoredUserId();
    if (!id) return [];

    const url = `${DATA_ENDPOINT}?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    return data.accounts || [];
  }

  static async getTransactions(userId?: string): Promise<Transaction[]> {
    const id = userId || this.getStoredUserId();
    if (!id) return [];

    const url = `${DATA_ENDPOINT}?userId=${encodeURIComponent(id)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    return data.transactions || [];
  }

  // Call this after returning from Fiskil consent (or whenever you want to force sync)
  static async refreshTransactions(accessToken: string): Promise<{ success: boolean; count?: number }> {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export async function initiateBankConnection(
  email: string,
  accessToken?: string
): Promise<{ consentUrl: string; userId: string }> {
  const res = await fetch(CONSENT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
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

  try {
    localStorage.setItem(LS_PENDING_USER_ID, data.userId);
    localStorage.setItem(LS_CONNECTION_STATUS, "pending");
  } catch (err) {
    console.warn("Unable to persist pending user id", err);
  }

  BankingService.setStoredUserId(data.userId);
  return data;
}