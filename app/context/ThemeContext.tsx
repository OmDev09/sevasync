'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('');

  // Handle hydration mismatch by setting on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('sevasync-theme') || '';
    setThemeState(storedTheme);
    if (storedTheme) {
      document.body.classList.add(storedTheme);
    }
  }, []);

  const setTheme = (newTheme: string) => {
    // Remove old theme
    if (theme) document.body.classList.remove(theme);
    // Add new theme
    if (newTheme) document.body.classList.add(newTheme);
    
    setThemeState(newTheme);
    localStorage.setItem('sevasync-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light-theme' ? '' : 'light-theme');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
