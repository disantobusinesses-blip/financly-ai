import { createClient, Session, User } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined) ||
  "https://wyommhasmvdhqxwehhel.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY : undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type OnboardingStep = "BASICS" | "MONEY" | "COMPLETE";

export interface SupabaseProfile {
  id: string;
  email: string;
  full_name: string;
  onboarding_step: OnboardingStep;
  is_onboarded: boolean;
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
  const { error } = await supabase.from("profiles").upsert(updates, { returning: "minimal" });
  return error ? { error: error.message } : {};
};
