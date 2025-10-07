import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Persisted preferences
  const [theme, setTheme] = useState(() => (localStorage.getItem('pref:theme') || 'day'));
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('pref:highContrast') === 'true');

  // Apply root classes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'night') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('pref:theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    localStorage.setItem('pref:highContrast', String(highContrast));
  }, [highContrast]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'day' ? 'night' : 'day'), []);
  const toggleHighContrast = useCallback(() => setHighContrast(h => !h), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() { return useContext(ThemeContext); }
