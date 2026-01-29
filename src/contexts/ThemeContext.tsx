import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { triggerHaptic } from '../utils/iosUtils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    
    // Check iOS system preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeQuery.matches ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check for saved theme in localStorage, default to 'system'
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as Theme) || 'system';
    });

    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);

    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    useEffect(() => {
        // Listen for iOS system theme changes
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
            
            // Trigger haptic feedback on iOS for theme change
            triggerHaptic('light');
        };

        darkModeQuery.addEventListener('change', handleSystemThemeChange);
        
        return () => {
            darkModeQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old theme class
        root.classList.remove(effectiveTheme === 'light' ? 'dark' : 'light');
        // Add new theme class
        root.classList.add(effectiveTheme);

        // Save theme preference to localStorage
        localStorage.setItem('theme', theme);
    }, [theme, effectiveTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
