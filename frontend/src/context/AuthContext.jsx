import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const existing = localStorage.getItem('token');
  const [token, setToken] = useState(existing || null);
  const [user, setUser] = useState(null);
  function login(t, u) { setToken(t); localStorage.setItem('token', t); setUser(u); }
  function logout() { setToken(null); localStorage.removeItem('token'); setUser(null); }
  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
