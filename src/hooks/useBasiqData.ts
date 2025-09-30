import { useEffect, useState } from "react";
import { Account, Transaction } from "../types";
import { BankingService } from "../services/BankingService";

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
    const storedId = localStorage.getItem("basiqUserId") || "";
    const basiqUserId = userId || storedId;

    // ✅ live if we have any non-empty string ID
    const isLive = typeof basiqUserId === "string" && basiqUserId.length > 0;
    const currentMode: "demo" | "live" = isLive ? "live" : "demo";

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const accs = await BankingService.getAccounts(currentMode, basiqUserId);
        const txns = await BankingService.getTransactions(currentMode, basiqUserId);

        setAccounts(accs);
        setTransactions(txns);
        setMode(currentMode);
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
