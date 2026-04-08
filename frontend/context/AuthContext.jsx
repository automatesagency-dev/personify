'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authAPI } from '../services/api';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const inactivityTimer = useRef(null);

  // Load token from localStorage after mount (client-only)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    if (!storedToken) {
      setLoading(false);
    }
  }, []);

  // Load user whenever token is set
  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await authAPI.register({ email, password, name });
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    return response.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Set up inactivity tracking when user is logged in
  useEffect(() => {
    if (!user) return;

    resetInactivityTimer();
    INACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      INACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
    };
  }, [user, resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
