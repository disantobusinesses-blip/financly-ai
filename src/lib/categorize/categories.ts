export type Category =
  | "Income"
  | "Rent/Mortgage"
  | "Utilities"
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Fuel"
  | "Health"
  | "Subscriptions"
  | "Shopping"
  | "Education"
  | "Travel"
  | "Fees"
  | "Transfers"
  | "Cash"
  | "Taxes"
  | "Charity"
  | "Misc";

export type TxType =
  | "credit"
  | "debit"
  | "transfer"
  | "refund"
  | "fee"
  | "atm"
  | "interest"
  | "unknown";

export interface Tx {
  id: string;
  description: string;
  amount: number;
  currency: "AUD" | "USD";
  date: string;
  mcc?: string;
  merchantName?: string;
  regionHint?: "AU" | "US";
}

export interface Categorized {
  id: string;
  category: Category;
  type: TxType;
  source: "rule" | "ai";
  confidence: number;
  ruleId?: string;
  aiReason?: string;
}
