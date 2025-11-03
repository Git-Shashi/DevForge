'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'grey' | 'dim';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('devforge-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'grey', 'dim'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    // Apply theme immediately
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-grey', 'theme-dim');
    document.documentElement.classList.add(`theme-${savedTheme || 'dark'}`);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('devforge-theme', newTheme);
    
    // Update theme class
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-grey', 'theme-dim');
    document.documentElement.classList.add(`theme-${newTheme}`);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Return a default value if context is not available (during SSR or before mount)
  if (context === undefined) {
    // Provide a safe default that won't cause errors
    return {
      theme: 'dark' as Theme,
      setTheme: () => {},
      mounted: false,
    };
  }
  
  return context;
}
