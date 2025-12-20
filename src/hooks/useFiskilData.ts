// src/hooks/useFiskilData.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

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
    accountId: String(raw?.account_id || raw?.accountId),
    description: String(raw?.description || raw?.merchant?.name || "Transaction"),
    amount: parseAmount(raw?.amount),
    date,
    category: String(raw?.category || "Other"),
  };
};

export interface FiskilDataResult {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useFiskilData(identityKey?: string): FiskilDataResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const fetchedOnceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) {
          setAccounts([]);
          setTransactions([]);
          setError("Please log in to view your bank data.");
          return;
        }

        const res = await fetch("/api/fiskil-data", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const payload = await res.json();

        if (!res.ok) {
          if (String(payload?.error).toLowerCase().includes("no connected bank")) {
            setAccounts([]);
            setTransactions([]);
            setError("No connected bank account yet.");
            return;
          }
          throw new Error(payload?.error || "Failed to load bank data");
        }

        const acc = Array.isArray(payload.accounts) ? payload.accounts.map(normalizeAccount) : [];
        const tx = Array.isArray(payload.transactions) ? payload.transactions.map(normalizeTransaction) : [];

        if (!cancelled) {
          setAccounts(acc);
          setTransactions(tx);
          setLastUpdated(new Date().toISOString());
          fetchedOnceRef.current = true;
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            fetchedOnceRef.current
              ? "We’re reconnecting to your bank. Showing last known data."
              : e?.message || "Failed to load bank data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [identityKey]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}
