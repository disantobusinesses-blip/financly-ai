
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check for saved theme in localStorage, default to 'light'
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as Theme) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old theme class
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        // Add new theme class
        root.classList.add(theme);

        // Save theme to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
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
