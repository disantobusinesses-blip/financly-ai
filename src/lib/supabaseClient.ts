import { createClient, Session, User } from "@supabase/supabase-js";

const getEnv = (key: string): string | undefined => {
  // Vite / modern bundlers
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && typeof metaEnv[key] !== "undefined") return metaEnv[key];
  } catch {
    // ignore
  }

  // Node / server runtimes
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
};

const supabaseUrl =
  getEnv("VITE_SUPABASE_URL") ||
  getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnv("SUPABASE_URL") ||
  "https://wyommhasmvdhqxwehhel.supabase.co";

const supabaseAnonKey =
  getEnv("VITE_SUPABASE_ANON_KEY") ||
  getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  getEnv("SUPABASE_ANON_KEY") ||
  ""; // must be set via env in production

if (!supabaseUrl) {
  throw new Error("Missing Supabase URL (set VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL).");
}
if (!supabaseAnonKey) {
  throw new Error(
    "Missing Supabase anon key (set VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OnboardingStep = "BASICS" | "MONEY" | "CONNECT_BANK" | "COMPLETE";

export interface SupabaseProfile {
  id: string;
  email: string;
  full_name: string;
  onboarding_step: OnboardingStep;
  is_onboarded: boolean;
  basiq_user_id?: string | null;
  has_bank_connection?: boolean | null;
  last_transactions_sync_at?: string | null;
  country?: string | null;
  currency?: string | null;
  pay_cycle?: string | null;
  primary_bank?: string | null;
}

export const fetchActiveSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const session = await fetchActiveSession();
  if (!session) return null;
  return session.user ?? null;
};

export const fetchProfile = async (): Promise<SupabaseProfile | null> => {
  const user = await fetchCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as SupabaseProfile | null) ?? null;
};

export const upsertProfile = async (
  updates: Partial<SupabaseProfile> & { id: string }
): Promise<{ error?: string }> => {
  const { error } = await supabase
    .from("profiles")
    .upsert(updates, { onConflict: "id" })
    .select()
    .single();

  return error ? { error: error.message } : {};
};
