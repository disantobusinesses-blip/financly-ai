import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { User, UserMembershipType } from "../types";
import { registerReferral, syncReferralProfile } from "../services/ReferralService";
import { isDevProUnlocked } from "../utils/devFlags";

interface SignupPayload {
  email: string;
  password: string;
  region: "AU" | "US";
  plan: UserMembershipType;
  displayName: string;
  avatar: string;
  referredBy?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
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
  remainingBasicDays: number | null;
}

interface StoredUser extends Omit<User, "createdAt"> {
  createdAt?: string;
  password: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const USERS_KEY = "myaibank_users";
const CURRENT_USER_KEY = "myaibank_current_user";
const LEGACY_USERS_KEY = "financly_users";
const LEGACY_CURRENT_USER_KEY = "financly_current_user";

const normaliseUser = (raw: StoredUser): User => {
  const createdAt = raw.createdAt || new Date().toISOString();
  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.displayName || raw.email.split("@")[0],
    avatar: raw.avatar || "💸",
    membershipType: isDevProUnlocked
      ? "Pro"
      : raw.membershipType === "Pro"
      ? "Pro"
      : "Basic",
    region: raw.region || "AU",
    basicTrialEnds: raw.basicTrialEnds,
    proTrialEnds: raw.proTrialEnds,
    referredBy: raw.referredBy,
    createdAt,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredCurrentUser = (): StoredUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored =
      localStorage.getItem(CURRENT_USER_KEY) ??
      localStorage.getItem(LEGACY_CURRENT_USER_KEY);
    return stored ? (JSON.parse(stored) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getStoredCurrentUser();
    return stored ? normaliseUser(stored) : null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const getUsers = (): StoredUser[] => {
    try {
      const raw =
        localStorage.getItem(USERS_KEY) ??
        localStorage.getItem(LEGACY_USERS_KEY) ??
        "[]";
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.removeItem(LEGACY_USERS_KEY);
  };

  useEffect(() => {
    const stored = getStoredCurrentUser();
    if (stored) {
      setUser(normaliseUser(stored));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }

    // Seed demo pro account for testing
    const users = getUsers();
    if (!users.find((u) => u.email === "demo@myaibank.ai")) {
      users.push({
        id: "user_demo_123",
        email: "demo@myaibank.ai",
        password: "demo123",
        membershipType: "Pro",
        region: "AU",
        displayName: "MyAiBank Demo",
        avatar: "🧠",
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void syncReferralProfile({ userId: user.id, email: user.email });
  }, [user]);

  const persistCurrentUser = (storedUser: StoredUser | null) => {
    if (storedUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(storedUser));
      localStorage.removeItem(LEGACY_CURRENT_USER_KEY);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(LEGACY_CURRENT_USER_KEY);
    }
  };

  const signup = (payload: SignupPayload): boolean => {
    const users = getUsers();
    const exists = users.some((u) => u.email === payload.email);
    if (exists) {
      alert("An account with this email already exists.");
      return false;
    }

    const now = new Date();
    const membershipType: UserMembershipType = isDevProUnlocked
      ? "Pro"
      : payload.plan === "Pro"
      ? "Basic"
      : payload.plan;
    const storedUser: StoredUser = {
      id: `user_${now.getTime()}`,
      email: payload.email,
      password: payload.password,
      membershipType,
      region: payload.region,
      displayName: payload.displayName.trim() || payload.email.split("@")[0],
      avatar: payload.avatar,
      createdAt: now.toISOString(),
      basicTrialEnds:
        membershipType === "Basic"
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      proTrialEnds: undefined,
      referredBy: payload.referredBy ?? undefined,
    };

    users.push(storedUser);
    saveUsers(users);

    const normalised = normaliseUser(storedUser);
    setUser(normalised);
    persistCurrentUser(storedUser);
    setIsSignupModalOpen(false);

    void syncReferralProfile({ userId: storedUser.id, email: storedUser.email });
    if (storedUser.referredBy) {
      void registerReferral({
        referrerId: storedUser.referredBy,
        referredEmail: storedUser.email,
        referredUserId: storedUser.id,
      });
    }
    if (payload.plan === "Pro") {
      setIsUpgradeModalOpen(true);
    }
    return true;
  };

  const login = (email: string, password: string): boolean => {
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      alert("Invalid email or password.");
      return false;
    }

    const normalised = normaliseUser(found);
    setUser(normalised);
    persistCurrentUser(found);
    setIsLoginModalOpen(false);
    void syncReferralProfile({
      userId: found.id,
      email: found.email,
      stripeCustomerId: found.stripeCustomerId,
      stripeSubscriptionId: found.stripeSubscriptionId,
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    persistCurrentUser(null);
    localStorage.removeItem("basiqUserId");
    localStorage.removeItem("accountsCache");
    localStorage.removeItem("transactionsCache");
  };

  const upgradeUser = (userId: string) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    users[idx].membershipType = "Pro";
    delete users[idx].basicTrialEnds;
    users[idx].proTrialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    saveUsers(users);

    if (user && user.id === userId) {
      const updated = normaliseUser(users[idx]);
      setUser(updated);
      persistCurrentUser(users[idx]);
    }
  };

  const remainingBasicDays = useMemo(() => {
    if (!user || user.membershipType !== "Basic" || !user.basicTrialEnds) return null;
    const expiry = new Date(user.basicTrialEnds).getTime();
    const now = Date.now();
    if (expiry <= now) return 0;
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }, [user]);

  const value = useMemo(
    () => ({
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
      remainingBasicDays,
    }),
    [
      user,
      isLoginModalOpen,
      isSignupModalOpen,
      isUpgradeModalOpen,
      remainingBasicDays,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
