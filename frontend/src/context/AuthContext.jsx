import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const existing = localStorage.getItem('token');
  const [token, setToken] = useState(existing || null);
  const [user, setUser] = useState(null);
  const logoutTimer = useRef(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const login = useCallback((t, u) => {
    setToken(t);
    localStorage.setItem('token', t);
    setUser(u);
    setSessionExpired(false);
  }, []);

  const performLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  // Debounced logout prevents rapid multiple calls (e.g., multiple 401 responses racing)
  const logout = useCallback((opts = {}) => {
    const { expired = false, delay = 150 } = opts;
    if (expired) setSessionExpired(true);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      performLogout();
    }, delay);
  }, [performLogout]);

  return <AuthContext.Provider value={{ token, user, login, logout, sessionExpired }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
