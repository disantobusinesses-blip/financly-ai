import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  SupabaseProfile,
  SupabaseSession,
  getStoredSession,
  persistSession,
  supabaseGetProfile,
  supabaseGetUser,
  supabaseSignIn,
  supabaseSignOut,
  supabaseSignUp,
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
  signup: (payload: SignupPayload) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  useEffect(() => {
    const init = async () => {
      if (!session?.access_token) return;
      const { user } = await supabaseGetUser(session.access_token);
      if (!user) {
        persistSession(null);
        setSession(null);
        return;
      }
      await refreshProfile();
    };
    void init();
  }, [session?.access_token]);

  const user = useMemo(() => {
    if (!session) return null;
    return buildUserFromProfile(session, profile);
  }, [session, profile]);

  const signup = async (payload: SignupPayload): Promise<{ error?: string }> => {
    setLoading(true);
    const { session: newSession, error } = await supabaseSignUp({
      email: payload.email,
      password: payload.password,
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
        username: payload.username,
        region: payload.region,
      },
    });

    if (!newSession || error) {
      setLoading(false);
      return { error: error || "Unable to create account" };
    }

    persistSession(newSession);
    setSession(newSession);

    await supabaseUpsertProfile(newSession.access_token, {
      id: newSession.user.id,
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
    const { session: newSession, error } = await supabaseSignIn({ email, password });
    if (!newSession || error) {
      setLoading(false);
      return { error: error || "Unable to login" };
    }

    persistSession(newSession);
    setSession(newSession);
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
