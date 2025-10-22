// 🚀 REPLACEMENT FOR: /src/contexts/AuthContext.tsx
// Mock signup/login, persists user, exposes modal toggles.

import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User, UserMembershipType } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  signup: (payload: SignupPayload) => boolean;
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

interface StoredUser extends User {
  password: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  region: "AU" | "US";
  membershipType: UserMembershipType;
  gender: string;
  avatar: string;
}

const db = {
  getUsers: (): StoredUser[] =>
    JSON.parse(localStorage.getItem("financly_users") || "[]"),
  saveUsers: (users: StoredUser[]) =>
    localStorage.setItem("financly_users", JSON.stringify(users)),
  getCurrentUser: (): User | null => {
    const s = localStorage.getItem("financly_current_user");
    if (!s) return null;
    try {
      const parsed = JSON.parse(s) as User;
      return normalisePublicUser(parsed);
    } catch (error) {
      console.warn("Unable to parse current user", error);
      return null;
    }
  },
  setCurrentUser: (u: User | null) => {
    if (u) {
      const normalised = normalisePublicUser(u);
      localStorage.setItem("financly_current_user", JSON.stringify(normalised));
    } else {
      localStorage.removeItem("financly_current_user");
    }
  },
};

const BASIC_TRIAL_DAYS = 7;

const toSafeDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const ensureTrialWindow = (record: StoredUser): StoredUser => {
  const membership = record.membershipType === "Pro" ? "Pro" : "Basic";
  const createdAt = record.createdAt ?? new Date().toISOString();

  if (membership === "Pro") {
    return {
      ...record,
      membershipType: "Pro",
      createdAt,
      basicTrialStartedAt: undefined,
      basicTrialEndsAt: undefined,
    };
  }

  const existingStart =
    toSafeDate(record.basicTrialStartedAt) ?? toSafeDate(record.createdAt);
  const start = existingStart ?? new Date();
  const trialEnds =
    toSafeDate(record.basicTrialEndsAt) ?? addDays(start, BASIC_TRIAL_DAYS);

  return {
    ...record,
    membershipType: "Basic",
    createdAt,
    basicTrialStartedAt: start.toISOString(),
    basicTrialEndsAt: trialEnds.toISOString(),
  };
};

const sanitiseUser = (record: StoredUser): StoredUser => ensureTrialWindow(record);

const normalisePublicUser = (user: User): User => {
  const membership = user.membershipType === "Pro" ? "Pro" : "Basic";
  const createdAt = user.createdAt ?? new Date().toISOString();

  if (membership === "Pro") {
    return {
      ...user,
      membershipType: "Pro",
      createdAt,
      basicTrialStartedAt: undefined,
      basicTrialEndsAt: undefined,
    };
  }

  const start =
    toSafeDate(user.basicTrialStartedAt) ?? toSafeDate(user.createdAt) ?? new Date();
  const end = toSafeDate(user.basicTrialEndsAt) ?? addDays(start, BASIC_TRIAL_DAYS);

  return {
    ...user,
    membershipType: "Basic",
    createdAt,
    basicTrialStartedAt: start.toISOString(),
    basicTrialEndsAt: end.toISOString(),
  };
};

const toPublicUser = (record: StoredUser): User => {
  const normalised = sanitiseUser(record);
  const { password: _password, ...user } = normalised;
  return user;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const saved = db.getCurrentUser();
    if (saved) setUser(normalisePublicUser(saved));

    // seed a demo user (mock auth only)
    const users = db
      .getUsers()
      .map((record) => sanitiseUser(record));

    if (!users.find((u) => u.email === "demo@financly.com")) {
      users.push(
        sanitiseUser({
          id: "user_demo_123",
          email: "demo@financly.com",
          password: "demo123",
          membershipType: "Pro",
          region: "AU",
          name: "Demo", 
          createdAt: new Date().toISOString(),
        })
      );
    }

    db.saveUsers(users);
  }, []);

  const signup = ({
    name,
    email,
    password,
    region,
    membershipType,
    gender,
    avatar,
  }: SignupPayload): boolean => {
    const users = db.getUsers().map((record) => sanitiseUser(record));

    if (users.find((u) => u.email === email)) {
      alert("An account with this email already exists.");
      return false;
    }

    const now = new Date();
    const baseRecord: StoredUser = {
      id: `user_${Date.now()}`,
      email,
      password,
      membershipType,
      region,
      name,
      gender,
      avatar,
      createdAt: now.toISOString(),
      basicTrialStartedAt:
        membershipType === "Basic" ? now.toISOString() : undefined,
      basicTrialEndsAt:
        membershipType === "Basic"
          ? addDays(now, BASIC_TRIAL_DAYS).toISOString()
          : undefined,
    };

    const record = sanitiseUser(baseRecord);
    const publicUser = toPublicUser(record);

    users.push(record);
    db.saveUsers(users);
    setUser(publicUser);
    db.setCurrentUser(publicUser);
    setIsSignupModalOpen(false);
    return true;
  };

  const login = (email: string, pass: string): boolean => {
    const users = db.getUsers().map((record) => sanitiseUser(record));
    const found = users.find((u) => u.email === email && u.password === pass);
    if (!found) {
      alert("Invalid email or password.");
      return false;
    }
    const publicUser = toPublicUser(found);
    db.saveUsers(users);
    setUser(publicUser);
    db.setCurrentUser(publicUser);
    setIsLoginModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    db.setCurrentUser(null);
    // optional: clear basiqUserId if you want logout to fully reset bank link
    // localStorage.removeItem("basiqUserId");
  };

  const upgradeUser = (userId: string) => {
    const users = db.getUsers().map((record) => sanitiseUser(record));
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      const updatedRecord = sanitiseUser({
        ...users[idx],
        membershipType: "Pro",
        basicTrialStartedAt: undefined,
        basicTrialEndsAt: undefined,
      });

      users[idx] = updatedRecord;
      db.saveUsers(users);
      const publicUser = toPublicUser(updatedRecord);
      setUser(publicUser);
      db.setCurrentUser(publicUser);
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