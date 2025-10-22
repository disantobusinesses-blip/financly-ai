import { Transaction } from "../types";

const RAW_CATEGORY_MAP: Record<string, string> = {
  "food": "Food & Dining",
  "food & drink": "Food & Dining",
  "food_and_drink": "Food & Dining",
  "groceries": "Groceries",
  "shopping": "Shopping",
  "retail": "Shopping",
  "transport": "Transport",
  "fuel": "Transport",
  "travel": "Travel",
  "transportation": "Transport",
  "rideshare": "Transport",
  "subscriptions": "Subscriptions",
  "entertainment": "Entertainment",
  "housing": "Housing",
  "rent": "Housing",
  "mortgage": "Housing",
  "utilities": "Utilities",
  "bills": "Utilities",
  "insurance": "Insurance",
  "health": "Health & Fitness",
  "medical": "Healthcare",
  "fitness": "Health & Fitness",
  "education": "Education",
  "fees": "Fees & Charges",
  "service fees": "Fees & Charges",
  "interest": "Fees & Charges",
  "loan": "Debt Repayments",
  "debt": "Debt Repayments",
  "savings": "Savings",
  "transfer": "Transfers",
  "transfers": "Transfers",
  "transaction": "General Spending",
  "transactions": "General Spending",
  "income": "Income",
  "payroll": "Income",
  "salary": "Income",
};

const KEYWORD_RULES: { category: string; keywords: string[] }[] = [
  { category: "Income", keywords: ["salary", "payroll", "wage", "payslip", "payg", "deposit from", "tax refund"] },
  { category: "Groceries", keywords: ["coles", "woolworth", "aldi", "iga", "grocery"] },
  { category: "Dining Out", keywords: ["restaurant", "cafe", "bar", "dining", "ubereats", "deliveroo"] },
  { category: "Transport", keywords: ["uber", "ola", "lyft", "taxi", "fuel", "petrol", "servo", "bp", "caltex", "shell"] },
  { category: "Subscriptions", keywords: ["spotify", "netflix", "stan", "binge", "amazon prime", "apple tv", "disney"] },
  { category: "Housing", keywords: ["rent", "mortgage", "real estate", "property", "strata"] },
  { category: "Utilities", keywords: ["electricity", "energy", "agl", "origin", "water", "internet", "telstra", "optus", "nbn"] },
  { category: "Health & Fitness", keywords: ["gym", "fitness", "pilates", "yoga", "chemist", "pharmacy", "doctor", "clinic"] },
  { category: "Shopping", keywords: ["kmart", "jb hi-fi", "harvey norman", "officeworks", "the icon", "myer", "david jones", "jb hi fi"] },
  { category: "Debt Repayments", keywords: ["afterpay", "zip", "credit card", "loan payment", "repayment"] },
  { category: "Travel", keywords: ["qantas", "jetstar", "virgin", "airbnb", "booking.com", "hotel"] },
  { category: "Insurance", keywords: ["insurance", "insur"] },
  { category: "Education", keywords: ["course", "university", "study", "udemy", "coursera"] },
  { category: "Savings", keywords: ["savings", "transfer to savings", "round up"] },
  { category: "Transfers", keywords: ["transfer", "payment to", "from account", "internal transfer"] },
];

const ACRONYM_WORDS = new Set([
  "ATM",
  "BP",
  "NAB",
  "ANZ",
  "HSBC",
  "ING",
  "NBN",
  "ATO",
  "QANTAS",
]);

export const cleanDescription = (description: unknown): string => {
  if (typeof description !== "string") return "Transaction";

  const trimmed = description.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Transaction";

  const words = trimmed.toLowerCase().split(" ");

  return words
    .map((word) => {
      const upperCandidate = word.toUpperCase();
      if (ACRONYM_WORDS.has(upperCandidate)) {
        return upperCandidate;
      }
      if (/^\d/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

const normaliseCategoryLabel = (value: string): string => {
  if (!value) return "General Spending";
  const trimmed = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!trimmed) return "General Spending";
  return trimmed
    .toLowerCase()
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

export const categorizeTransaction = (
  rawCategory?: unknown,
  description?: unknown,
  amount: number = 0
): string => {
  const candidateCategory = String(rawCategory || "").toLowerCase();
  const descriptionText = String(description || "").toLowerCase();
  const combinedSource = `${candidateCategory} ${descriptionText}`;

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => combinedSource.includes(keyword))) {
      return rule.category;
    }
  }

  if (candidateCategory && RAW_CATEGORY_MAP[candidateCategory]) {
    return RAW_CATEGORY_MAP[candidateCategory];
  }

  if (candidateCategory) {
    const label = normaliseCategoryLabel(candidateCategory);
    if (label === "Transaction") {
      return amount >= 0 ? "Income" : "General Spending";
    }
    return label;
  }

  if (amount >= 0) {
    return "Income";
  }

  return "General Spending";
};

const parseDateValue = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object") {
    const dateLike = value as Record<string, unknown>;
    if (dateLike.iso) return parseDateValue(dateLike.iso);
    if (dateLike.date) return parseDateValue(dateLike.date);
    if (dateLike.datetime) return parseDateValue(dateLike.datetime);
  }
  return null;
};

export const formatTransactionDate = (
  value: unknown,
  locale?: string
): string => {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return "Pending";
  }
  try {
    return parsed.toLocaleDateString(locale || undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return parsed.toISOString().split("T")[0];
  }
};

export const enhanceTransactions = (transactions: Transaction[]): Transaction[] =>
  transactions.map((txn) => {
    const description = cleanDescription(txn.description);
    return {
      ...txn,
      description,
      category: categorizeTransaction(txn.category, description, txn.amount),
    };
  });
