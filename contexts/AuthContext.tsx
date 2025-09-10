import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserMembershipType } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  signup: (email: string, pass: string, region: 'AU' | 'US') => boolean;
  logout: () => void;
  upgradeUser: (userId: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSignupModalOpen: boolean;
  setIsSignupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// --- LocalStorage Simulation ---
// In a real app, these functions would make API calls to your backend.
const db = {
    getUsers: (): any[] => {
        const users = localStorage.getItem('financly_users');
        return users ? JSON.parse(users) : [];
    },
    saveUsers: (users: any[]) => {
        localStorage.setItem('financly_users', JSON.stringify(users));
    },
    getCurrentUser: (): User | null => {
         const user = localStorage.getItem('financly_current_user');
        return user ? JSON.parse(user) : null;
    },
    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem('financly_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('financly_current_user');
        }
    }
}
// -----------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // On initial load, check if a user is saved in localStorage
    useEffect(() => {
        const savedUser = db.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }

        // Pre-populate with a demo user if none exist
        const users = db.getUsers();
        if (!users.find(u => u.email === 'demo@financly.com')) {
            users.push({
                id: 'user_demo_123',
                email: 'demo@financly.com',
                password: 'demo123', // In a real app, this would be a hash
                membershipType: 'Pro',
                region: 'AU' // Demo user is Australian
            });
            db.saveUsers(users);
        }
    }, []);

    const signup = (email: string, pass: string, region: 'AU' | 'US'): boolean => {
        const users = db.getUsers();
        if (users.find(u => u.email === email)) {
            alert('An account with this email already exists.');
            return false;
        }
        const newUser: User = {
            id: `user_${Date.now()}`,
            email,
            membershipType: 'Free',
            region: region
        };
        const newUserWithPass = { ...newUser, password: pass }; // In a real app, hash the password
        
        users.push(newUserWithPass);
        db.saveUsers(users);
        
        setUser(newUser);
        db.setCurrentUser(newUser);

        setIsSignupModalOpen(false);
        return true;
    };

    const login = (email: string, pass: string): boolean => {
        const users = db.getUsers();
        const foundUser = users.find(u => u.email === email && u.password === pass);

        if (foundUser) {
            const userToSave: User = {
                id: foundUser.id,
                email: foundUser.email,
                membershipType: foundUser.membershipType,
                region: foundUser.region || 'AU' // Default to 'AU' for legacy users
            };
            setUser(userToSave);
            db.setCurrentUser(userToSave);
            setIsLoginModalOpen(false);
            return true;
        }
        alert('Invalid email or password.');
        return false;
    };

    const logout = () => {
        setUser(null);
        db.setCurrentUser(null);
    };

    const upgradeUser = (userId: string) => {
        const users = db.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].membershipType = 'Pro';
            db.saveUsers(users);

            const userFromDb = users[userIndex];
            const updatedUser: User = {
                id: userFromDb.id,
                email: userFromDb.email,
                membershipType: userFromDb.membershipType,
                region: userFromDb.region || 'AU'
            };
            setUser(updatedUser);
            db.setCurrentUser(updatedUser);
        }
    };


    return (
        <AuthContext.Provider value={{ 
            user, login, signup, logout, upgradeUser,
            isLoginModalOpen, setIsLoginModalOpen, 
            isSignupModalOpen, setIsSignupModalOpen,
            isUpgradeModalOpen, setIsUpgradeModalOpen
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};