// src/demo/demoData.ts
import { Transaction, SavingsPlan } from "../types";

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
    accountId: "acc1",
    description: "Uber Eats",
    amount: -35.4,
    date: "2025-08-14",
    category: "Food & Drink",
  },
  {
    id: "8",
    accountId: "acc1",
    description: "Gym Membership",
    amount: -60,
    date: "2025-08-15",
    category: "Subscriptions",
  },
];

export const demoBalance = 5000;

export const demoSavingsPlan: SavingsPlan = {
  totalMonthlySavings: 1000, // big number so forecast shows large optimized gain
  newGoalDate: "2026-01-01",
  monthsSaved: 12,
  suggestions: [
    {
      category: "Food & Drink",
      monthlyCut: 100,
      description: "Cut eating out by $100/month",
    },
    {
      category: "Subscriptions",
      monthlyCut: 20,
      description: "Cancel unused subscriptions",
    },
  ],
};
