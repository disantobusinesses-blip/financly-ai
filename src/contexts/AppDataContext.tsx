import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useFiskilData } from "../hooks/useFiskilData";
import type { Account, Transaction } from "../types";

type AppDataContextValue = {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  connected: boolean;
  syncStatus: any;
  debugInfo: any;
  refresh: () => Promise<void> | void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // IMPORTANT: Fiskil flow unchanged — we just call the existing hook once at the app-shell level.
  const fiskil = useFiskilData(user?.id);

  const value = useMemo<AppDataContextValue>(
    () => ({
      accounts: fiskil.accounts,
      transactions: fiskil.transactions,
      loading: fiskil.loading,
      error: fiskil.error ?? null,
      lastUpdated: fiskil.lastUpdated ?? null,
      connected: Boolean(fiskil.connected),
      syncStatus: fiskil.syncStatus,
      debugInfo: fiskil.debugInfo,
      refresh: fiskil.refresh,
    }),
    [
      fiskil.accounts,
      fiskil.transactions,
      fiskil.loading,
      fiskil.error,
      fiskil.lastUpdated,
      fiskil.connected,
      fiskil.syncStatus,
      fiskil.debugInfo,
      fiskil.refresh,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = (): AppDataContextValue => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
};
