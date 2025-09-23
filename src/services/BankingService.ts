// src/services/BankingService.ts
import { Account, Transaction } from "../types";
import { demoAccounts, demoTransactions } from "../demo/demoData";

/**
 * BankingService:
 * Provides access to demo data when no Basiq connection exists.
 * In the future you can expand this to switch between demo + live sources.
 */
export class BankingService {
  static async getAccounts(): Promise<Account[]> {
    // For demo, return local accounts
    return demoAccounts;
  }

  static async getTransactions(): Promise<Transaction[]> {
    // For demo, return local transactions
    return demoTransactions;
  }
}
