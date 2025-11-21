const DEFAULT_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? (process.env.SUPABASE_URL as string) : undefined) ||
  "https://wyommhasmvdhqxwehhel.supabase.co";

const DEFAULT_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? (process.env.SUPABASE_ANON_KEY as string) : undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5b21taGFzbXZkaHF4d2VoaGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTUwNDksImV4cCI6MjA3OTMzMTA0OX0.myCT42sdT4l69qMbH_tFGGGr60POlzu4IVZj7tFyjR0";

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
}

export interface SupabaseProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  username: string;
  region: string;
  subscription_status?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}

const baseHeaders = {
  apikey: DEFAULT_SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};

const sessionKey = "myaibank_supabase_session";

export const supabaseConfig = {
  url: DEFAULT_SUPABASE_URL,
  anonKey: DEFAULT_SUPABASE_ANON_KEY,
};

export const persistSession = (session: SupabaseSession | null) => {
  if (!session) {
    localStorage.removeItem(sessionKey);
    return;
  }
  localStorage.setItem(sessionKey, JSON.stringify(session));
};

export const getStoredSession = (): SupabaseSession | null => {
  const raw = localStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SupabaseSession;
    return parsed;
  } catch {
    return null;
  }
};

export const supabaseSignUp = async (payload: {
  email: string;
  password: string;
  data?: Record<string, unknown>;
}): Promise<{ session: SupabaseSession | null; error?: string }> => {
  const response = await fetch(`${DEFAULT_SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { ...baseHeaders },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { session: null, error: err?.msg || err?.message || "Unable to sign up" };
  }

  const data = (await response.json()) as { session: SupabaseSession | null };
  return { session: data.session, error: undefined };
};

export const supabaseSignIn = async (payload: {
  email: string;
  password: string;
}): Promise<{ session: SupabaseSession | null; error?: string }> => {
  const response = await fetch(`${DEFAULT_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { ...baseHeaders },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { session: null, error: err?.msg || err?.error_description || "Unable to sign in" };
  }

  const data = (await response.json()) as SupabaseSession;
  return { session: data, error: undefined };
};

export const supabaseGetUser = async (
  accessToken: string
): Promise<{ user: SupabaseSession["user"] | null }> => {
  const response = await fetch(`${DEFAULT_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: DEFAULT_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return { user: null };
  const data = await response.json();
  return { user: data?.user || null };
};

export const supabaseGetProfile = async (
  accessToken: string,
  userId: string
): Promise<{ profile: SupabaseProfile | null }> => {
  const response = await fetch(
    `${DEFAULT_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: DEFAULT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) return { profile: null };
  const data = (await response.json()) as SupabaseProfile[];
  return { profile: data?.[0] ?? null };
};

export const supabaseUpsertProfile = async (
  accessToken: string,
  profile: SupabaseProfile
): Promise<{ error?: string }> => {
  const response = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...baseHeaders,
      Authorization: `Bearer ${accessToken}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { error: err?.message || "Unable to save profile" };
  }
  return {};
};

export const supabaseUpdateSubscription = async (
  accessToken: string,
  userId: string,
  updates: Partial<Pick<SupabaseProfile, "subscription_status" | "stripe_customer_id" | "stripe_subscription_id">>
): Promise<{ error?: string }> => {
  const response = await fetch(
    `${DEFAULT_SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return { error: err?.message || "Unable to update subscription" };
  }
  return {};
};

export const supabaseSignOut = async (accessToken: string): Promise<void> => {
  await fetch(`${DEFAULT_SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: DEFAULT_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => undefined);
};
