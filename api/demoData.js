// api/demoData.js
export const demoBalance = 9400.4;

export const demoAccounts = [
  { id: "acc1", name: "Everyday Account", type: "CHECKING", balance: 2450.75, currency: "AUD" },
  { id: "acc2", name: "Savings Account", type: "SAVINGS", balance: 8200.1, currency: "AUD" },
  { id: "acc3", name: "Credit Card", type: "CREDIT_CARD", balance: -1250.45, currency: "AUD" },
];

export const demoTransactions = [
  { id: "1", accountId: "acc1", description: "Woolworths Groceries", amount: -120.55, date: "2025-08-02", category: "Groceries" },
  { id: "2", accountId: "acc1", description: "Spotify Subscription", amount: -12.99, date: "2025-08-05", category: "Subscriptions" },
  { id: "3", accountId: "acc1", description: "Rent Payment", amount: -1500, date: "2025-08-01", category: "Housing" },
  { id: "4", accountId: "acc1", description: "Salary", amount: 4000, date: "2025-08-01", category: "Income" },
  { id: "5", accountId: "acc1", description: "Netflix Subscription", amount: -15.99, date: "2025-08-10", category: "Subscriptions" },
  { id: "6", accountId: "acc1", description: "Electricity Bill", amount: -180, date: "2025-08-12", category: "Utilities" },
  { id: "7", accountId: "acc2", description: "Interest Earned", amount: 25.5, date: "2025-08-15", category: "Income" },
  { id: "8", accountId: "acc3", description: "Flight Booking", amount: -650, date: "2025-08-18", category: "Travel" },
];

export const demoSavingsPlan = [
  { name: "Holiday Fund", targetAmount: 5000, currentAmount: 2000, monthlyContribution: 400 },
  { name: "Emergency Fund", targetAmount: 10000, currentAmount: 6000, monthlyContribution: 300 },
];

export const demoOptimizationPlan = {
  suggestions: [
    { category: "Subscriptions", monthlyCut: 18.98, description: "Cancel overlapping streaming services." },
    { category: "Utilities", monthlyCut: 22.0, description: "Switch to off-peak energy plan." },
    { category: "Dining", monthlyCut: 45.0, description: "Cap eating out to 1/week." },
  ],
  totalMonthlySavings: 85.98,
  newGoalDate: "2026-01-01",
  monthsSaved: 4,
};
