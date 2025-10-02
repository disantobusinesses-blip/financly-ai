import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  signup: (email: string, pass: string, region: "AU" | "US") => boolean;
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

// --- LocalStorage simulation ---
const db = {
  getUsers: (): any[] => {
    const users = localStorage.getItem("financly_users");
    return users ? JSON.parse(users) : [];
  },
  saveUsers: (users: any[]) => {
    localStorage.setItem("financly_users", JSON.stringify(users));
  },
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem("financly_current_user");
    return user ? JSON.parse(user) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem("financly_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("financly_current_user");
    }
  },
};
// -------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // On initial load: hydrate user and seed demo account
  useEffect(() => {
    const savedUser = db.getCurrentUser();
    if (savedUser) setUser(savedUser);

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
  }, []);

  const signup = (email: string, pass: string, region: "AU" | "US"): boolean => {
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

    const newUserWithPass = { ...newUser, password: pass };
    users.push(newUserWithPass);
    db.saveUsers(users);

    setUser(newUser);
    db.setCurrentUser(newUser);

    setIsSignupModalOpen(false);
    return true;
  };

  const login = (email: string, pass: string): boolean => {
    const users = db.getUsers();
    let foundUser = users.find(
      (u) => u.email === email && u.password === pass
    );

    // ✅ If no user found, auto-create (mock signup)
    if (!foundUser) {
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password: pass,
        membershipType: "Free",
        region: "AU", // default region
      };
      users.push(newUser);
      db.saveUsers(users);
      foundUser = newUser;
    }

    const userToSave: User = {
      id: foundUser.id,
      email: foundUser.email,
      membershipType: foundUser.membershipType,
      region: foundUser.region || "AU",
    };

    setUser(userToSave);
    db.setCurrentUser(userToSave);
    setIsLoginModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    db.setCurrentUser(null);
  };

  const upgradeUser = (userId: string) => {
    const users = db.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].membershipType = "Pro";
      db.saveUsers(users);

      const updatedUser: User = {
        id: users[idx].id,
        email: users[idx].email,
        membershipType: users[idx].membershipType,
        region: users[idx].region || "AU",
      };

      setUser(updatedUser);
      db.setCurrentUser(updatedUser);
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
