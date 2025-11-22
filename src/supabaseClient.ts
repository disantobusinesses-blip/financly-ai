import {
  getStoredSession,
  supabaseAuth,
  supabaseGetUser,
  supabaseUpdateUser,
  SupabaseSession,
} from "./lib/supabaseClient";

export const supabase = {
  auth: {
    signUp: supabaseAuth.auth.signUp,
    signInWithPassword: supabaseAuth.auth.signInWithPassword,
    getSession: supabaseAuth.auth.getSession,
    getUser: async () => {
      const session = getStoredSession();
      if (!session?.access_token) return { data: { user: null }, error: "No active session" };
      const { user } = await supabaseGetUser(session.access_token);
      return { data: { user }, error: user ? null : "Unable to fetch user" };
    },
    updateUser: async ({ data }: { data: Record<string, unknown> }) => {
      const session = getStoredSession();
      if (!session?.access_token) return { data: null, error: "No active session" };
      const { user, error } = await supabaseUpdateUser(session.access_token, data);
      return { data: user ?? null, error: error ?? null };
    },
  },
};

export type { SupabaseSession };
