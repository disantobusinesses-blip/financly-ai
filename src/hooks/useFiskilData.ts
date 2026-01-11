// src/hooks/useFiskilData.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

const MAX_EMPTY_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

const parseAmount = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const m = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (m?.[0]) return Number(m[0]) || 0;
  }
  if (value && typeof value === "object") {
    const v: any = value;
    return parseAmount(v.current ?? v.available ?? v.amount ?? v.value ?? v.balance ?? 0);
  }
  return 0;
};

const mapAccountType = (rawType: unknown, name: string): AccountType => {
  if (ACCOUNT_TYPE_VALUES.has(rawType as AccountType)) return rawType as AccountType;
  const src = `${rawType || name}`.toLowerCase();
  if (src.includes("savings")) return AccountType.SAVINGS;
  if (src.includes("credit")) return AccountType.CREDIT_CARD;
  if (src.includes("loan") || src.includes("mortgage")) return AccountType.LOAN;
  return AccountType.CHECKING;
};

const normalizeAccount = (raw: any): Account => {
  const name = String(raw?.name || raw?.accountName || raw?.displayName || "Account").trim();
  const type = mapAccountType(raw?.type?.text || raw?.type || raw?.accountType, name);
  let balance = parseAmount(raw?.balance?.current ?? raw?.balance ?? raw?.amount ?? 0);

  if ((type === AccountType.CREDIT_CARD || type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }

  return {
    id: String(raw?.id || raw?.accountId),
    name,
    type,
    balance,
    currency: raw?.currency || "AUD",
  };
};

const normalizeTransaction = (raw: any): Transaction => {
  const date = new Date(
    raw?.date || raw?.postedAt || raw?.transactionDate || raw?.createdAt || Date.now()
  ).toISOString();

  return {
    id: String(raw?.id || `${raw?.description}-${date}`),
    accountId: String(raw?.account_id || raw?.accountId || ""),
    description: String(raw?.description || raw?.merchant?.name || "Transaction"),
    amount: parseAmount(raw?.amount),
    date,
    category: String(raw?.category || "Other"),
  };
};

type FiskilDebug = {
  fiskil_base_url?: string;
  endpoints?: { accounts?: string | null; transactions?: string | null };
  status?: { accounts?: number | null; transactions?: number | null };
  samples?: { accounts?: Record<string, unknown>[]; transactions?: Record<string, unknown>[] };
};

type FiskilDataPayload = {
  connected?: boolean;
  end_user_id?: string | null;
  accounts?: any[];
  transactions?: any[];
  last_updated?: string | null;
  source?: string;
  debug?: FiskilDebug;
  error?: string;
};

export interface FiskilDataResult {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
  connected: boolean;
  debugInfo: FiskilDebug | null;
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function shouldRetryEmpty(accounts: Account[], transactions: Transaction[]): boolean {
  return accounts.length === 0 && transactions.length === 0;
}

export function useFiskilData(identityKey?: string): FiskilDataResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<FiskilDebug | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: number | null = null;

    const fetchData = async (attempt: number) => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const jwt = session?.access_token;

        if (!jwt) {
          if (!cancelled) {
            setConnected(false);
            setAccounts([]);
            setTransactions([]);
            setError("Please log in to view your bank data.");
            setLoading(false);
          }
          return;
        }

        const res = await fetch("/api/fiskil-data", {
          headers: { Authorization: `Bearer ${jwt}` },
          cache: "no-store",
        });

        const payload = (await safeJson(res)) as FiskilDataPayload;

        if (!res.ok) {
          const msg = typeof payload?.error === "string" ? payload.error : "Failed to load bank data";
          throw new Error(msg);
        }

        const accRaw = Array.isArray(payload.accounts) ? payload.accounts : [];
        const txRaw = Array.isArray(payload.transactions) ? payload.transactions : [];
        const acc = accRaw.map(normalizeAccount);
        const tx = txRaw.map(normalizeTransaction);
        const isConnected = Boolean(payload.connected);

        if (!cancelled) {
          setConnected(isConnected);
          setAccounts(acc);
          setTransactions(tx);
          setLastUpdated(payload.last_updated || null);
          setDebugInfo(payload.debug || null);
          setError(null);
        }

        if (!isConnected) {
          if (!cancelled) {
            setError("No connected bank account yet.");
            setLoading(false);
          }
          return;
        }

        if (shouldRetryEmpty(acc, tx)) {
          if (attempt < MAX_EMPTY_RETRIES) {
            retryTimeout = window.setTimeout(() => {
              void fetchData(attempt + 1);
            }, RETRY_DELAY_MS);
            return;
          }

          if (!cancelled) {
            setError(
              "No transactions returned from Fiskil yet. Try reconnecting or wait 1–2 minutes."
            );
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load bank data");
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setError(null);
    setAccounts([]);
    setTransactions([]);
    setDebugInfo(null);
    setLastUpdated(null);

    void fetchData(1);

    return () => {
      cancelled = true;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [identityKey]);

  return {
    accounts,
    transactions,
    loading,
    error,
    mode: "live",
    lastUpdated,
    connected,
    debugInfo,
  };
}
