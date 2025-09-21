import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('day');
  useEffect(() => {
    document.body.style.background = theme === 'night' ? '#111' : '#fafafa';
    document.body.style.color = theme === 'night' ? '#eee' : '#111';
  }, [theme]);
  const toggle = () => setTheme(t => t === 'day' ? 'night' : 'day');
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return useContext(ThemeContext); }
