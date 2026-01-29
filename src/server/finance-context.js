import { createClient } from "@supabase/supabase-js";
import { buildFinanceContext } from "../utils/financeContext.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const supabaseAdmin = (() => {
  mustEnv("SUPABASE_URL", SUPABASE_URL);
  mustEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();

export async function getFinanceContextForUser(userId) {
  if (!userId) return null;

  try {
    const [accountsResult, transactionsResult, profileResult] = await Promise.all([
      supabaseAdmin.from("accounts").select("*").eq("user_id", userId),
      supabaseAdmin.from("transactions").select("*").eq("user_id", userId),
      supabaseAdmin.from("profiles").select("last_transactions_sync_at, country").eq("id", userId).maybeSingle(),
    ]);

    if (accountsResult.error || transactionsResult.error || profileResult.error) {
      console.error("Error fetching data for finance context:", {
        accountsError: accountsResult.error,
        transactionsError: transactionsResult.error,
        profileError: profileResult.error,
      });
      return null;
    }

    const accounts = accountsResult.data || [];
    const transactions = transactionsResult.data || [];
    const profile = profileResult.data;

    if (!accounts.length && !transactions.length) {
      return null;
    }

    const region = profile?.country || "AU";
    const lastUpdated = profile?.last_transactions_sync_at || new Date().toISOString();

    return buildFinanceContext(accounts, transactions, region, lastUpdated);
  } catch (error) {
    console.error("Error fetching finance context:", error);
    return null;
  }
}
