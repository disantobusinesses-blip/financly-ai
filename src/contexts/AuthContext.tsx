import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { SupabaseProfile } from "../lib/supabaseClient";
import { User as AppUser } from "../types";

export interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthContextType {
  user: AppUser | null;
  profile: SupabaseProfile | null;
  session: Session | null;
  loading: boolean;
  remainingBasicDays: number | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isSignupModalOpen: boolean;
  setIsSignupModalOpen: (open: boolean) => void;
  openSignupModal: () => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  upgradeUser: (plan?: any) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildUserFromProfile = (session: Session, profile: SupabaseProfile | null): AppUser => {
  const fallbackName = session.user.email?.split("@")[0] || "Member";
  return {
    id: session.user.id,
    email: session.user.email || "",
    displayName: profile?.full_name || fallbackName,
    avatar: "🧠",
    membershipType: profile?.is_onboarded ? "Pro" : "Basic",
    region: (profile?.country as "AU" | "US") || "AU",
    createdAt: session.user.created_at || new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingBasicDays] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const refreshProfile = async (): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData.session;
    if (!activeSession?.user?.id) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", activeSession.user.id).maybeSingle();
    if (error) {
      console.error("Unable to load profile", error);
      setProfile(null);
      return;
    }

    setProfile((data as SupabaseProfile) || null);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        await refreshProfile();
      }
      setLoading(false);
    };
    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const user = useMemo(() => {
    if (!session) return null;
    return buildUserFromProfile(session, profile);
  }, [session, profile]);

  const signup = async (payload: SignupPayload): Promise<{ error?: string }> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: payload.fullName },
      },
    });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    if (data.session) {
      setSession(data.session);
    }

    setLoading(false);
    return {};
  };

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setLoading(false);
      return { error: error?.message || "Unable to login" };
    }
    setSession(data.session);
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Unable to load profile", profileError);
      setProfile(null);
      setLoading(false);
      return { error: profileError.message };
    }

    if (!profileData) {
      const { data: upserted, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.session.user.id,
            email: data.session.user.email || "",
            full_name: data.session.user.user_metadata?.full_name || "",
          },
          { onConflict: "id" }
        )
        .select()
        .single();

      if (upsertError) {
        console.error("Unable to upsert profile", upsertError);
        setProfile(null);
        setLoading(false);
        return { error: upsertError.message };
      }
      setProfile(upserted as SupabaseProfile);
    } else {
      setProfile(profileData as SupabaseProfile);
    }
    setLoading(false);
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const openSignupModal = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const upgradeUser = async (plan?: any) => {
    console.log("upgradeUser called", plan);
    setIsUpgradeModalOpen(true);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    remainingBasicDays,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isSignupModalOpen,
    setIsSignupModalOpen,
    openSignupModal,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    upgradeUser,
    signup,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
