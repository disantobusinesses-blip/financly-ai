// src/demo/demoData.ts
import { Transaction, SavingsPlan } from "../types";

export const demoBalance = 9400.4; // add this

export const demoAccounts = [
  {
    id: "acc1",
    name: "Everyday Account",
    type: "Checking",
    balance: 2450.75,
    institution: "Demo Bank",
  },
  {
    id: "acc2",
    name: "Savings Account",
    type: "Savings",
    balance: 8200.1,
    institution: "Demo Bank",
  },
  {
    id: "acc3",
    name: "Credit Card",
    type: "Credit Card",
    balance: -1250.45,
    institution: "Demo Bank",
  },
];

export const demoTransactions: Transaction[] = [
  // ... your transactions unchanged
];

export const demoSavingsPlans: SavingsPlan[] = [
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
