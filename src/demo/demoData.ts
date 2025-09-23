// src/demo/demoData.ts
import { Transaction, SavingsPlan, Account, AccountType } from "../types";

export const demoBalance = 9400.4;

export const demoAccounts: Account[] = [
  {
    id: "acc1",
    name: "Everyday Account",
    type: AccountType.CHECKING,
    balance: 2450.75,
    currency: "AUD",
  },
  {
    id: "acc2",
    name: "Savings Account",
    type: AccountType.SAVINGS,
    balance: 8200.1,
    currency: "AUD",
  },
  {
    id: "acc3",
    name: "Credit Card",
    type: AccountType.CREDIT_CARD,
    balance: -1250.45,
    currency: "AUD",
  },
];

export const demoTransactions: Transaction[] = [
  {
    id: "1",
    accountId: "acc1",
    description: "Woolworths Groceries",
    amount: -120.55,
    date: "2025-08-02",
    category: "Groceries",
  },
  {
    id: "2",
    accountId: "acc1",
    description: "Spotify Subscription",
    amount: -12.99,
    date: "2025-08-05",
    category: "Subscriptions",
  },
  {
    id: "3",
    accountId: "acc1",
    description: "Rent Payment",
    amount: -1500,
    date: "2025-08-01",
    category: "Housing",
  },
  {
    id: "4",
    accountId: "acc1",
    description: "Salary",
    amount: 4000,
    date: "2025-08-01",
    category: "Income",
  },
  {
    id: "5",
    accountId: "acc1",
    description: "Netflix Subscription",
    amount: -15.99,
    date: "2025-08-10",
    category: "Subscriptions",
  },
  {
    id: "6",
    accountId: "acc1",
    description: "Electricity Bill",
    amount: -180,
    date: "2025-08-12",
    category: "Utilities",
  },
  {
    id: "7",
    accountId: "acc2",
    description: "Interest Earned",
    amount: 25.5,
    date: "2025-08-15",
    category: "Income",
  },
  {
    id: "8",
    accountId: "acc3",
    description: "Flight Booking",
    amount: -650,
    date: "2025-08-18",
    category: "Travel",
  },
];

export const demoSavingsPlan: SavingsPlan[] = [
  {
    name: "Holiday Fund",
    targetAmount: 5000,
    currentAmount: 2000,
    monthlyContribution: 400,
  },
  {
    name: "Emergency Savings",
    targetAmount: 10000,
    currentAmount: 6000,
    monthlyContribution: 300,
  },
];
