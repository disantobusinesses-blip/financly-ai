// 🚀 REPLACEMENT FOR: /src/contexts/AuthContext.tsx
// Mock signup/login, persists user, exposes modal toggles.

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { OnboardingState, User, UserMembershipType } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (
    email: string,
    pass: string,
    region: "AU" | "US",
    onboardingState?: OnboardingState
  ) => Promise<boolean>;
  logout: () => void;
  upgradeUser: (userId: string) => void;

  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSignupModalOpen: boolean;
  setIsSignupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  openLoginModal: () => void;
  openSignupModal: () => void;
}

const db = {
  getUsers: (): any[] => JSON.parse(localStorage.getItem("financly_users") || "[]"),
  saveUsers: (users: any[]) => localStorage.setItem("financly_users", JSON.stringify(users)),
  getCurrentUser: (): User | null => {
    const s = localStorage.getItem("financly_current_user");
    return s ? JSON.parse(s) : null;
  },
  setCurrentUser: (u: User | null) => {
    if (u) localStorage.setItem("financly_current_user", JSON.stringify(u));
    else localStorage.removeItem("financly_current_user");
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const supabaseReady = Boolean(supabase);

  const userFromSupabase = (supabaseUser: any): User => {
    const region = (supabaseUser?.user_metadata?.region as "AU" | "US") || "AU";
    const membershipType =
      (supabaseUser?.user_metadata?.membershipType as UserMembershipType | undefined) || "Free";

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      membershipType,
      region,
    };
  };

  useEffect(() => {
    const seedLocalUsers = () => {
      const saved = db.getCurrentUser();
      if (saved) setUser(saved);

      const users = db.getUsers();
      if (!users.find((u) => u.email === "demo@financly.com")) {
        users.push({
          id: "user_demo_123",
          email: "demo@financly.com",
          password: "demo123",
          membershipType: "Pro",
          region: "AU",
        });
        db.saveUsers(users);
      }
    };

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const bootstrap = async () => {
      if (supabaseReady) {
        const { data } = await supabase!.auth.getSession();
        if (!isMounted) return;

        if (data.session?.user) {
          setUser(userFromSupabase(data.session.user));
        }

        const { data: listener } = supabase!.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            setUser(null);
            db.setCurrentUser(null);
            return;
          }

          if (session?.user) {
            const mapped = userFromSupabase(session.user);
            setUser(mapped);
            db.setCurrentUser(mapped);
          }
        });

        unsubscribe = () => listener.subscription.unsubscribe();
        return;
      }

      seedLocalUsers();
    };

    bootstrap();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [supabaseReady]);

  const signup = async (
    email: string,
    pass: string,
    region: "AU" | "US",
    onboardingState?: OnboardingState
  ): Promise<boolean> => {
    if (supabaseReady && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            region,
            membershipType: "Free",
            onboarding_state:
              onboardingState ||
              ({
                step: 1,
                status: "awaiting_verification",
                region,
                email,
                lastUpdated: new Date().toISOString(),
              } as OnboardingState),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Supabase signup failed", error.message);
        alert(error.message);
        return false;
      }

      if (data.user) {
        const mapped = userFromSupabase(data.user);
        setUser(mapped);
        db.setCurrentUser(mapped);
      }

      setIsSignupModalOpen(false);
      return true;
    }

    const users = db.getUsers();
    if (users.find((u) => u.email === email)) {
      alert("An account with this email already exists.");
      return false;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      membershipType: "Free",
      region,
    };
    users.push({ ...newUser, password: pass });
    db.saveUsers(users);
    setUser(newUser);
    db.setCurrentUser(newUser);
    setIsSignupModalOpen(false);
    return true;
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (supabaseReady && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        console.error("Supabase login failed", error.message);
        alert(error.message);
        return false;
      }

      if (data.session?.user) {
        const mapped = userFromSupabase(data.session.user);
        setUser(mapped);
        db.setCurrentUser(mapped);
      }
      setIsLoginModalOpen(false);
      return true;
    }

    const users = db.getUsers();
    const found = users.find((u) => u.email === email && u.password === pass);
    if (!found) {
      alert("Invalid email or password.");
      return false;
    }
    const u: User = {
      id: found.id,
      email: found.email,
      membershipType: found.membershipType,
      region: found.region || "AU",
    };
    setUser(u);
    db.setCurrentUser(u);
    setIsLoginModalOpen(false);
    return true;
  };

  const logout = () => {
    if (supabaseReady && supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    db.setCurrentUser(null);
    // optional: clear basiqUserId if you want logout to fully reset bank link
    // localStorage.removeItem("basiqUserId");
  };

  const upgradeUser = (userId: string) => {
    const users = db.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].membershipType = "Pro";
      db.saveUsers(users);
      const updated: User = {
        id: users[idx].id,
        email: users[idx].email,
        membershipType: users[idx].membershipType,
        region: users[idx].region || "AU",
      };
      setUser(updated);
      db.setCurrentUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        upgradeUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isSignupModalOpen,
        setIsSignupModalOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        openSignupModal: () => setIsSignupModalOpen(true),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};