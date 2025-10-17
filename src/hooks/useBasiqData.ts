// 🚀 Optimized useBasiqData.ts — fast + cached + parallel Gemini ready
import { useEffect, useState } from "react";
import { Account, AccountType, Transaction } from "../types";
import { categorizeTransaction, cleanDescription } from "../utils/transactions";

type RawAccount = Record<string, any> | null | undefined;
type RawTransaction = Record<string, any> | null | undefined;

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `basiq-${Math.random().toString(36).slice(2, 11)}`;
};

const parseNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    // Some payloads come through concatenated (e.g. "06397.5712000.00") which
    // breaks simple parseFloat. Grab the first numeric token instead.
    const numericMatches = value.match(/-?\d+(?:\.\d+)?/g);
    if (numericMatches && numericMatches.length > 0) {
      const parsed = Number.parseFloat(numericMatches[0]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const cleaned = value.replace(/[^0-9.-]+/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const mapAccountType = (rawType: unknown): AccountType => {
  const normalised = String(rawType || "").toLowerCase();

  switch (normalised) {
    case "savings":
    case "saver":
      return AccountType.SAVINGS;
    case "credit card":
    case "credit":
    case "card":
      return AccountType.CREDIT_CARD;
    case "loan":
    case "mortgage":
      return AccountType.LOAN;
    default:
      return AccountType.CHECKING;
  }
};

const normaliseAccount = (raw: RawAccount): Account | null => {
  if (!raw) return null;

  const id = raw.id ?? raw.accountId ?? generateId();
  const name =
    raw.name ??
    raw.account_name ??
    raw.institutionName ??
    raw.provider ??
    "Account";
  const type = mapAccountType(raw.type ?? raw.productType ?? raw.class);
  const balance = Math.round(
    parseNumber(
      raw.balance ?? raw.currentBalance ?? raw.availableBalance ?? raw.amount
    ) * 100
  ) / 100;
  const currency = String(
    (raw.currency ?? raw.currencyCode ?? raw.currency_code ?? "AUD")
  ).toUpperCase();

  return {
    id: String(id),
    name: cleanDescription(name),
    type,
    balance,
    currency: currency || "AUD",
  };
};

const normaliseTransaction = (raw: RawTransaction): Transaction | null => {
  if (!raw) return null;

  const id = raw.id ?? raw.transactionId ?? generateId();
  const accountId =
    raw.accountId ?? raw.account_id ?? raw.account?.id ?? generateId();
  const rawDescription =
    raw.description ?? raw.summary ?? raw.reference ?? "Transaction";
  const description = cleanDescription(rawDescription);
  const amount =
    Math.round(
      parseNumber(raw.amount ?? raw.value ?? raw.balance ?? 0) * 100
    ) / 100;
  const dateSource =
    raw.date ?? raw.postDate ?? raw.posted_at ?? raw.transactionDate;
  const parsedDate = dateSource ? new Date(dateSource) : new Date();
  const date = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();
  const rawCategory =
    raw.category ?? raw.classification ?? raw.subclass ?? raw.type ?? "";
  const category = categorizeTransaction(rawCategory, description, amount);

  return {
    id: String(id),
    accountId: String(accountId ?? ""),
    description,
    amount,
    date,
    category,
  };
};

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "live";
  lastUpdated: string | null;
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("basiqUserId") || "";
    const basiqUserId = userId || storedId;
    if (!basiqUserId) {
      setAccounts([]);
      setTransactions([]);
      setLoading(false);
      setError("No connected bank account yet.");
      return;
    }

    // 🔹 Try cached data immediately
    const cachedAccounts = localStorage.getItem("accountsCache");
    const cachedTransactions = localStorage.getItem("transactionsCache");
    const cachedTime = localStorage.getItem("basiqCacheTime");
    if (cachedAccounts && cachedTransactions) {
      try {
        const cachedAcc = JSON.parse(cachedAccounts);
        const cachedTx = JSON.parse(cachedTransactions);

        const normalisedAccounts = (Array.isArray(cachedAcc) ? cachedAcc : [])
          .map((raw: unknown): Account | null => normaliseAccount(raw as RawAccount))
          .filter((account: Account | null): account is Account => Boolean(account));
        const normalisedTransactions = (Array.isArray(cachedTx) ? cachedTx : [])
          .map((raw: unknown): Transaction | null => normaliseTransaction(raw as RawTransaction))
          .filter((transaction: Transaction | null): transaction is Transaction => Boolean(transaction));

        setAccounts(normalisedAccounts);
        setTransactions(normalisedTransactions);
        setLastUpdated(cachedTime || null);
        setLoading(false);
      } catch {
        console.warn("⚠️ Cache parse failed, fetching fresh data");
      }
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/basiq-data?userId=${encodeURIComponent(basiqUserId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();

        const acc = (Array.isArray(data.accounts) ? data.accounts : [])
          .map((raw: unknown): Account | null => normaliseAccount(raw as RawAccount))
          .filter((account: Account | null): account is Account => Boolean(account));
        const tx = (Array.isArray(data.transactions) ? data.transactions : [])
          .map((raw: unknown): Transaction | null => normaliseTransaction(raw as RawTransaction))
          .filter((transaction: Transaction | null): transaction is Transaction => Boolean(transaction));

        setAccounts(acc);
        setTransactions(tx);
        setError(null);
        setLastUpdated(new Date().toISOString());

        // 🔹 Save to cache for next load
        localStorage.setItem("accountsCache", JSON.stringify(acc));
        localStorage.setItem("transactionsCache", JSON.stringify(tx));
        localStorage.setItem("basiqCacheTime", new Date().toISOString());
      } catch (err: any) {
        console.error("❌ Failed to load Basiq data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    // 🔹 Fetch fresh in background
    fetchData();

    // 🔁 Optional periodic refresh (every 5 min)
    const id = setInterval(fetchData, 300_000);
    return () => clearInterval(id);
  }, [userId]);

  return { accounts, transactions, loading, error, mode: "live", lastUpdated };
}