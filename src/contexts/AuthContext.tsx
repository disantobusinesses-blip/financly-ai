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

interface AuthContextType {
  user: AppUser | null;
  profile: SupabaseProfile | null;
  session: Session | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(false);

  const refreshProfile = async (): Promise<void> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData.session;
    if (!activeSession?.user?.id) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", activeSession.user.id).maybeSingle();
    setProfile((data as SupabaseProfile | null) ?? null);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        await refreshProfile();
      }
    };
    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
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

    const newUser = data.user;
    if (newUser) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: newUser.id,
        email: payload.email,
        full_name: payload.fullName,
        onboarding_step: "BASICS",
        is_onboarded: false,
      });
      if (profileError) {
        setLoading(false);
        return { error: profileError.message };
      }
    }

    if (data.session) {
      setSession(data.session);
      await refreshProfile();
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
    await refreshProfile();
    setLoading(false);
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
