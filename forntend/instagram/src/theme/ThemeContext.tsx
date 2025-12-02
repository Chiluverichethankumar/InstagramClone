// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { AppTheme, getTheme } from './theme';

interface ThemeContextValue {
  theme: AppTheme;
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// EXPORT AS BOTH: named AND default (so both imports work)
export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Also export as default so old imports still work if needed
export default AppThemeProvider;

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
};