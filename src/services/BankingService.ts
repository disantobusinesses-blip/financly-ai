// 🚀 BankingService.ts – Fiskil version
// Uses /api/fiskil-data and /api/start-fiskil-auth-session

import { Account, Transaction } from "../types";

const DATA_ENDPOINT = "/api/fiskil-data";
const START_SESSION_ENDPOINT = "/api/start-fiskil-auth-session";

export class BankingService {
  static getStoredUserId(): string | null {
    // You can rename this key later if you want, but keeping it
    // avoids breaking anything else that might read it.
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
}

export async function initiateBankConnection(
  email: string,
  accessToken?: string
): Promise<{ consentUrl: string; userId: string }> {
  const res = await fetch(START_SESSION_ENDPOINT, {
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

  // Store identifiers so callback or polling can finalise the connection
  try {
    localStorage.setItem("basiqPendingUserId", data.userId);
    localStorage.setItem("basiqConnectionStatus", "pending");
  } catch (err) {
    console.warn("Unable to persist pending Fiskil user id", err);
  }

  // Store userId so we can fetch data immediately after redirect
  BankingService.setStoredUserId(data.userId);

  return data; // caller will set window.location.href = consentUrl
}
