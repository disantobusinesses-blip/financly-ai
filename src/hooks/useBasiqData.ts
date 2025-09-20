// src/hooks/useBasiqData.ts
import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";

interface BasiqData {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export function useBasiqData(userId?: string): BasiqData {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const basiqUserId = userId || localStorage.getItem("basiqUserId");

    if (!basiqUserId) {
      console.warn("⚠️ No Basiq userId found, skipping data fetch.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ Use relative path (works locally and on Vercel)
        const res = await fetch(`/api/basiq-data?userId=${basiqUserId}`);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`API error (${res.status}): ${errText}`);
        }

        const data = await res.json();

        if (!data.accounts || !data.transactions) {
          throw new Error("Invalid response format from /api/basiq-data");
        }

        // Sort newest first
        const sortedTxns = data.transactions.sort(
          (a: Transaction, b: Transaction) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAccounts(data.accounts);
        setTransactions(sortedTxns);
      } catch (err: any) {
        console.error("❌ Error fetching Basiq data:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { accounts, transactions, loading, error };
}
