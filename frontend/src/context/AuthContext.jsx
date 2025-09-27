import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const existing = localStorage.getItem('token');
  const [token, setToken] = useState(existing || null);
  let initialUser = null;
  try {
    const stored = localStorage.getItem('user');
    if (stored) initialUser = JSON.parse(stored);
  } catch { /* ignore parse errors */ }
  const [user, setUser] = useState(initialUser);
  const logoutTimer = useRef(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const bootstrapInFlight = useRef(false);

  const login = useCallback((t, u) => {
    setToken(t);
    localStorage.setItem('token', t);
    if (u) {
      try { localStorage.setItem('user', JSON.stringify(u)); } catch { /* ignore */ }
    }
    setUser(u);
    setSessionExpired(false);
  }, []);

  const performLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  // Bootstrap user on mount or when token changes (if we have token but no user yet)
  useEffect(() => {
    if (!token || user || bootstrapInFlight.current) return;
    bootstrapInFlight.current = true;
    (async () => {
      try {
        const resp = await api.get('/auth/me', { headers: { Authorization: 'Bearer ' + token } });
        const fetchedUser = resp.data?.data?.user;
        if (fetchedUser) {
          setUser(fetchedUser);
          try { localStorage.setItem('user', JSON.stringify(fetchedUser)); } catch { /* ignore */ }
        }
      } catch (e) {
        performLogout();
      } finally {
        bootstrapInFlight.current = false;
      }
    })();
  }, [token, user, performLogout]);

  return <AuthContext.Provider value={{ token, user, login, logout, sessionExpired }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
