// src/hooks/useBasiqData.ts
import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mode: "demo" | "live";
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "live">("demo");

  useEffect(() => {
    const basiqUserId = userId || localStorage.getItem("basiqUserId") || "";

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ Demo mode: no userId
        const url = basiqUserId
          ? `/api/basiq-data?userId=${basiqUserId}`
          : `/api/basiq-data`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const data = await res.json();

        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setMode(data.mode || (basiqUserId ? "live" : "demo"));
      } catch (err: any) {
        console.error("❌ Failed to load data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { accounts, transactions, loading, error, mode };
}
