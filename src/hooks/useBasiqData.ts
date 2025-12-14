// 🚀 Optimized useFiskilData.ts — fast + cached + ready for AI insights (Fiskil-only)
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Account, AccountType, Transaction } from "../types";

const ACCOUNT_TYPE_VALUES = new Set(Object.values(AccountType));

const parseAmount = (value: any): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, " ");
    const matches = cleaned.match(/-?\d+(?:\.\d+)?/g);
    if (matches && matches.length > 0) {
      const parsed = parseFloat(matches[0]);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  if (value && typeof value === "object") {
    if (value.current !== undefined) return parseAmount(value.current);
    if (value.available !== undefined) return parseAmount(value.available);
    if (value.amount !== undefined) return parseAmount(value.amount);
    if (value.value !== undefined) return parseAmount(value.value);
    if (value.balance !== undefined) return parseAmount(value.balance);
  }
  return 0;
};

const mapAccountType = (rawType: any, name: string): AccountType => {
  if (ACCOUNT_TYPE_VALUES.has(rawType as AccountType)) return rawType as AccountType;
  const source = `${rawType || name}`.toLowerCase();
  if (source.includes("savings")) return AccountType.SAVINGS;
  if (source.includes("credit")) return AccountType.CREDIT_CARD;
  if (source.includes("loan") || source.includes("mortgage")) return AccountType.LOAN;
  return AccountType.CHECKING;
};

const normalizeAccount = (raw: any): Account => {
  if (!raw || typeof raw !== "object") {
    return {
      id: `acc-${Math.random().toString(36).slice(2)}`,
      name: "Account",
      type: AccountType.CHECKING,
      balance: 0,
      currency: "AUD",
    };
  }

  const name = (raw.name || raw.accountName || raw.displayName || raw.productName || "Account").toString().trim();
  const type = mapAccountType(raw.type?.text || raw.type?.code || raw.type || raw.accountType || raw.productType, name);

  const balanceSource =
    raw.balance?.current ??
    raw.balance?.available ??
    raw.balance ??
    raw.currentBalance ??
    raw.availableBalance ??
    raw.amount ??
    raw.openingBalance ??
    0;

  let balance = parseAmount(balanceSource);

  if ((type === AccountType.CREDIT_CARD || type === AccountType.LOAN) && balance > 0) {
    balance = -Math.abs(balance);
  }
  if (raw.balance?.current < 0 || raw.currentBalance < 0) {
    balance = parseAmount(raw.balance?.current ?? raw.currentBalance);
  }

  const currency =
    raw.balance?.currencyCode ||
    raw.balance?.currency ||
    raw.currencyCode ||
    raw.currency ||
    "AUD";

  return {
    id: String(raw.id || raw.accountId || raw.number || `acc-${Math.random().toString(36).slice(2)}`),
    name: name || "Account",
    type,
    balance,
    currency,
  };
};

const parseDateValue = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 10 ** 12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && trimmed.replace(/\D/g, "").length >= 8) {
      const ms = trimmed.length <= 10 ? numeric * 1000 : numeric;
      const numericDate = new Date(ms);
      if (!Number.isNaN(numericDate.getTime())) return numericDate;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const normalizeTransaction = (raw: any): Transaction => {
  if (!raw || typeof raw !== "object") {
    const fallbackDate = new Date().toISOString();
    return {
      id: `txn-${Math.random().toString(36).slice(2)}`,
      accountId: "unknown-account",
      description: "Transaction",
      amount: 0,
      date: fallbackDate,
      category: "Other",
    };
  }

  const description =
    (raw.description || raw.narration || raw.merchant?.name || "Transaction").toString().trim() || "Transaction";

  const amountSource = raw.amount ?? raw.amount?.value ?? raw.amount?.current ?? raw.amount?.amount ?? raw.transactionAmount;
  const amount = parseAmount(amountSource);

  const dateCandidates = [
    raw.date,
    raw.postDate,
    raw.transactionDate,
    raw.valueDate,
    raw.postedAt,
    raw.updatedAt,
    raw.createdAt,
  ];

  let isoDate: string | null = null;
  for (const candidate of dateCandidates) {
    const parsed = parseDateValue(candidate);
    if (parsed) {
      isoDate = parsed.toISOString();
      break;
    }
  }
  if (!isoDate) isoDate = new Date().toISOString();

  const categorySource = raw.category?.text || raw.category?.name || raw.category || raw.class || raw.subcategory || "Other";

  return {
    id: String(raw.id || raw.transactionId || `${description}-${isoDate}`),
    accountId: String(raw.account_id || raw.accountId || raw.account?.id || raw.account || "unknown-account"),
    description,
    amount,
    date: isoDate,
    category: categorySource ? String(categorySource) : "Other",
  };
};

interface FiskilData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useFiskilData(identityKey?: string): FiskilData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  useEffect(() => {
    const loadFromCache = () => {
      const cachedAccounts = localStorage.getItem("accountsCache");
      const cachedTransactions = localStorage.getItem("transactionsCache");
      const cachedTime = localStorage.getItem("fiskilCacheTime");

      if (!cachedAccounts || !cachedTransactions) return;

      try {
        const parsedAccounts = JSON.parse(cachedAccounts);
        const parsedTransactions = JSON.parse(cachedTransactions);

        const normalisedAccounts = Array.isArray(parsedAccounts) ? parsedAccounts.map(normalizeAccount) : [];
        const normalisedTransactions = Array.isArray(parsedTransactions)
          ? parsedTransactions.map(normalizeTransaction)
          : [];

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setLastUpdated(cachedTime || null);
        setLoading(false);

        hasDataRef.current = normalisedAccounts.length > 0 || normalisedTransactions.length > 0;
      } catch {
        // ignore cache errors
      }
    };

    const fetchData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          setAccounts([]);
          setTransactions([]);
          setError("Please log in to view your bank data.");
          setLoading(false);
          hasDataRef.current = false;
          return;
        }

        const res = await fetch("/api/fiskil-data", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let payload: any = {};
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = {};
        }

        if (!res.ok) {
          // If user has no bank connected, show friendly message
          const msg = payload?.error || "Failed to load bank data";
          if (res.status === 400 && String(msg).toLowerCase().includes("no connected bank")) {
            setAccounts([]);
            setTransactions([]);
            setError("No connected bank account yet.");
            setLoading(false);
            hasDataRef.current = false;
            return;
          }

          throw new Error(payload?.details || payload?.error || `API error ${res.status}`);
        }

        const acc = Array.isArray(payload.accounts) ? payload.accounts : [];
        const tx = Array.isArray(payload.transactions) ? payload.transactions : [];

        const normalisedAccounts = acc.map(normalizeAccount);
        const normalisedTransactions = tx.map(normalizeTransaction);

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setError(null);

        const nowIso = new Date().toISOString();
        setLastUpdated(nowIso);

        hasDataRef.current =
          normalisedAccounts.length > 0 || normalisedTransactions.length > 0 || hasDataRef.current;

        localStorage.setItem("accountsCache", JSON.stringify(normalisedAccounts));
        localStorage.setItem("transactionsCache", JSON.stringify(normalisedTransactions));
        localStorage.setItem("fiskilCacheTime", nowIso);
      } catch (err: any) {
        console.error("❌ Failed to load Fiskil data:", err);

        if (hasDataRef.current) {
          setError("We're retrying your bank sync. Showing last saved balances while we reconnect.");
        } else {
          setError(err?.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    // Load cache instantly, then fetch fresh
    loadFromCache();
    fetchData();

    const intervalId = setInterval(fetchData, 300_000); // every 5 min
    return () => clearInterval(intervalId);
  }, [identityKey]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}