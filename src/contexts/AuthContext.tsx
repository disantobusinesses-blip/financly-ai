import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  SupabaseProfile,
  SupabaseSession,
  getStoredSession,
  persistSession,
  supabaseGetProfile,
  supabaseGetUser,
  supabaseAuth,
  supabaseSignOut,
  supabaseUpsertProfile,
} from "../lib/supabaseClient";
import { User } from "../types";

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
  region: "AU" | "US";
}

interface AuthContextType {
  user: User | null;
  profile: SupabaseProfile | null;
  session: SupabaseSession | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  syncSession: (session: SupabaseSession | null) => Promise<void>;
  remainingBasicDays: number | null;
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  isUpgradeModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSignupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openLoginModal: () => void;
  openSignupModal: () => void;
  upgradeUser: (userId?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildUserFromProfile = (session: SupabaseSession, profile: SupabaseProfile | null): User => {
  const fallbackName = session.user.email?.split("@")[0] || "Member";
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username || fallbackName
    : fallbackName;
  return {
    id: session.user.id,
    email: session.user.email || "",
    displayName,
    avatar: "🧠",
    membershipType: profile?.subscription_status === "active" ? "Pro" : "Basic",
    region: (profile?.region as "AU" | "US") || "AU",
    createdAt: session.user.created_at || new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SupabaseSession | null>(() => getStoredSession());
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const refreshProfile = async (): Promise<void> => {
    if (!session?.access_token || !session.user?.id) return;
    const { profile } = await supabaseGetProfile(session.access_token, session.user.id);
    if (profile) setProfile(profile);
  };

  const syncSession = async (nextSession: SupabaseSession | null): Promise<void> => {
    persistSession(nextSession);
    setSession(nextSession);
    if (nextSession?.access_token && nextSession.user?.id) {
      const { profile } = await supabaseGetProfile(nextSession.access_token, nextSession.user.id);
      if (profile) {
        setProfile(profile);
        return;
      }

      const metadata = (nextSession as unknown as { user?: { user_metadata?: Record<string, unknown> } }).user?.user_metadata;
      if (metadata) {
        const fallbackProfile = {
          id: nextSession.user.id,
          first_name: String(metadata.first_name ?? ""),
          last_name: String(metadata.last_name ?? ""),
          phone: String(metadata.phone ?? ""),
          username: String(metadata.username ?? ""),
          region: String(metadata.region ?? "AU"),
          subscription_status: "pending",
        } as SupabaseProfile;
        await supabaseUpsertProfile(nextSession.access_token, fallbackProfile);
        setProfile(fallbackProfile);
        return;
      }
    }

    setProfile(null);
  };

  useEffect(() => {
    const init = async () => {
      const existingSession = session ?? getStoredSession();
      if (!existingSession?.access_token) return;
      const { user } = await supabaseGetUser(existingSession.access_token);
      if (!user) {
        await syncSession(null);
        return;
      }
      await syncSession({ ...existingSession, user });
    };
    void init();
  }, [session?.access_token]);

  const user = useMemo(() => {
    if (!session) return null;
    return buildUserFromProfile(session, profile);
  }, [session, profile]);

  const signup = async (
    payload: SignupPayload
  ): Promise<{ error?: string; requiresEmailConfirmation?: boolean }> => {
    setLoading(true);
    const { data, error } = await supabaseAuth.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone,
          username: payload.username,
          region: payload.region,
        },
      },
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    if (!data.session) {
      setLoading(false);
      return { requiresEmailConfirmation: true };
    }

    await syncSession(data.session);

    await supabaseUpsertProfile(data.session.access_token, {
      id: data.session.user.id,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      username: payload.username,
      region: payload.region,
      subscription_status: "pending",
    });

    await refreshProfile();
    setLoading(false);
    return {};
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    const newSession = data.session;
    if (!newSession || error) {
      setLoading(false);
      return { error: error || "Unable to login" };
    }

    await syncSession(newSession);
    await refreshProfile();
    setLoading(false);
    return {};
  };

  const logout = async () => {
    if (session?.access_token) {
      await supabaseSignOut(session.access_token);
    }
    persistSession(null);
    setSession(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signup,
    login,
    logout,
    refreshProfile,
    remainingBasicDays: null,
    isLoginModalOpen,
    isSignupModalOpen,
    isUpgradeModalOpen,
    setIsLoginModalOpen,
    setIsSignupModalOpen,
    setIsUpgradeModalOpen,
    syncSession,
    openLoginModal: () => setIsLoginModalOpen(true),
    openSignupModal: () => setIsSignupModalOpen(true),
    upgradeUser: () => setIsUpgradeModalOpen(true),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
