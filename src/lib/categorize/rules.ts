export interface Rule {
  id: string;
  region: "AU" | "US" | "ALL";
  keywords?: string[];
  regex?: string;
  category: import("./categories").Category;
  type?: import("./categories").TxType;
  confidence?: number;
}

export const RULES: Rule[] = [
  { id: "inc_payroll", region: "ALL", keywords: ["payroll", "salary", "wages", "direct deposit"], category: "Income", type: "credit", confidence: 0.99 },
  { id: "inc_interest", region: "ALL", keywords: ["interest", "int payment"], category: "Income", type: "interest", confidence: 0.99 },
  { id: "xfer_internal", region: "ALL", keywords: ["transfer", "xfer", "to savings", "from savings"], category: "Transfers", type: "transfer", confidence: 0.98 },
  { id: "atm_cash", region: "ALL", keywords: ["atm withdrawal", "cash withdrawal"], category: "Cash", type: "atm", confidence: 0.98 },
  { id: "bank_fee", region: "ALL", keywords: ["monthly fee", "account fee", "overdraft fee"], category: "Fees", type: "fee", confidence: 0.98 },
  { id: "refund", region: "ALL", keywords: ["refund", "reversal", "chargeback"], category: "Transfers", type: "refund", confidence: 0.98 },
  { id: "sub_netflix", region: "ALL", keywords: ["netflix"], category: "Subscriptions" },
  { id: "sub_spotify", region: "ALL", keywords: ["spotify"], category: "Subscriptions" },
  { id: "sub_apple", region: "ALL", keywords: ["apple com bill", "itunes"], category: "Subscriptions" },
  { id: "sub_microsoft", region: "ALL", keywords: ["microsoft", "xbox"], category: "Subscriptions" },
  { id: "sub_google", region: "ALL", keywords: ["google*services", "google storage", "youtube premium", "yt premium", "google play"], category: "Subscriptions" },
  { id: "gro_woolworths", region: "AU", keywords: ["woolworths", "woolies"], category: "Groceries" },
  { id: "gro_coles", region: "AU", keywords: ["coles"], category: "Groceries" },
  { id: "gro_aldi_au", region: "AU", keywords: ["aldi"], category: "Groceries" },
  { id: "gro_walmart", region: "US", keywords: ["walmart"], category: "Groceries" },
  { id: "gro_target", region: "US", keywords: ["target"], category: "Groceries" },
  { id: "gro_kroger", region: "US", keywords: ["kroger", "fred meyer", "ralphs", "smiths"], category: "Groceries" },
  { id: "gro_wholefoods", region: "US", keywords: ["whole foods"], category: "Groceries" },
  { id: "gro_traderjoes", region: "US", keywords: ["trader joes", "trader joe s"], category: "Groceries" },
  { id: "fuel_caltex", region: "AU", keywords: ["caltex", "ampol"], category: "Fuel" },
  { id: "fuel_bp", region: "ALL", keywords: ["bp"], category: "Fuel" },
  { id: "fuel_shell", region: "ALL", keywords: ["shell"], category: "Fuel" },
  { id: "fuel_7eleven", region: "AU", keywords: ["7 eleven"], category: "Fuel" },
  { id: "fuel_chevron", region: "US", keywords: ["chevron"], category: "Fuel" },
  { id: "util_optus", region: "AU", keywords: ["optus"], category: "Utilities" },
  { id: "util_telstra", region: "AU", keywords: ["telstra"], category: "Utilities" },
  { id: "util_nbn", region: "AU", keywords: ["nbn"], category: "Utilities" },
  { id: "util_att", region: "US", keywords: ["at t", "att"], category: "Utilities" },
  { id: "util_verizon", region: "US", keywords: ["verizon"], category: "Utilities" },
  { id: "util_comcast", region: "US", keywords: ["comcast", "xfinity"], category: "Utilities" },
  { id: "din_maccas", region: "AU", keywords: ["mcdonalds", "maccas"], category: "Dining" },
  { id: "din_kfc", region: "ALL", keywords: ["kfc"], category: "Dining" },
  { id: "din_starbucks", region: "US", keywords: ["starbucks"], category: "Dining" },
  { id: "din_ubereats", region: "ALL", keywords: ["uber eats", "ubereats", "doordash", "menulog"], category: "Dining" },
  { id: "rent_keywords", region: "ALL", keywords: ["rent", "property management", "realty", "strata"], category: "Rent/Mortgage" },
  { id: "mortgage", region: "ALL", keywords: ["mortgage", "home loan"], category: "Rent/Mortgage" },
  { id: "transport_uber", region: "ALL", keywords: ["uber", "lyft", "ola"], category: "Transport" },
];
