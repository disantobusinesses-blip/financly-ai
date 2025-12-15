import { supabase } from "../lib/supabaseClient";
import { Account, Transaction } from "../types";

const STORAGE = {
  endUserId: "fiskilEndUserId",
  connectionStatus: "fiskilConnectionStatus",
};

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : data?.details || data?.error || text);
  }

  return data;
}

async function getSupabaseAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export class BankingService {
  static getStoredEndUserId(): string | null {
    return readStorage(STORAGE.endUserId);
  }

  static setStoredEndUserId(id: string) {
    writeStorage(STORAGE.endUserId, id);
  }

  static clearStoredEndUserId() {
    removeStorage(STORAGE.endUserId);
    removeStorage(STORAGE.connectionStatus);
  }

  static async getAccounts(): Promise<Account[]> {
    const token = await getSupabaseAccessToken();
    if (!token) return [];

    const data = await fetchJson("/api/fiskil-data", {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.accounts || [];
  }

  static async getTransactions(): Promise<Transaction[]> {
    const token = await getSupabaseAccessToken();
    if (!token) return [];

    const data = await fetchJson("/api/fiskil-data", {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.transactions || [];
  }
}

export async function initiateBankConnection(
  accessToken: string
): Promise<{ redirectUrl: string; endUserId: string }> {
  const data = await fetchJson("/api/create-consent-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  const redirectUrl: string | undefined =
    data?.auth_url || data?.redirect_url || data?.url || data?.consentUrl;
  const endUserId: string | undefined = data?.end_user_id || data?.endUserId || data?.userId;

  if (!redirectUrl || !endUserId) {
    throw new Error("Invalid server response (missing redirect_url or end_user_id)");
  }

  // Persist for later fetch/callback flows (optional)
  BankingService.setStoredEndUserId(endUserId);
  writeStorage(STORAGE.connectionStatus, "pending");

  return { redirectUrl, endUserId };
}