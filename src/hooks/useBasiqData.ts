import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "demo" | "live";
  fallback: boolean; // ✅ true if backend forced demo after a live failure
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem("basiqUserId") || "";
    const basiqUserId = userId || storedId;

    // ✅ More flexible: accept any non-empty userId
    const isValidUserId = typeof basiqUserId === "string" && basiqUserId.trim().length > 0;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = isValidUserId
          ? `/api/basiq-data?userId=${encodeURIComponent(basiqUserId)}`
          : `/api/basiq-data`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error ${res.status}`);

        const data = await res.json();

        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setMode(data.mode || (isValidUserId ? "live" : "demo"));

        // ✅ backend sends error → fallback
        setFallback(!!data.error);
      } catch (err: any) {
        console.error("❌ Failed to load data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { accounts, transactions, loading, error, mode, fallback };
}
