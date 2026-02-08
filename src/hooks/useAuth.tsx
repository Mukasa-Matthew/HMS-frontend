import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';

type Role = 'SUPER_ADMIN' | 'CUSTODIAN' | 'HOSTEL_OWNER';

interface User {
  id: number;
  username: string;
  role: Role;
  hostelId: number | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    // Skip verification if already on login page
    if (window.location.pathname === '/login') {
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem('hms_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        // Verify token is still valid by checking /api/auth/me
        // Only verify once on mount - don't re-verify on every render
        verifyToken()
          .catch((err) => {
            // If verification fails, only log out if it's a definitive auth failure
            // Don't log out on network errors or temporary issues
            const status = err?.response?.status;
            // Only log out on definitive auth failures (400, 403) - not on network errors
            if (status === 400 || status === 403) {
              // Only log out if we're not already on login page
              if (window.location.pathname !== '/login') {
                localStorage.removeItem('hms_user');
                setUser(null);
                window.location.href = '/login';
              }
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        localStorage.removeItem('hms_user');
        setUser(null);
        setLoading(false);
      }
    } else {
      // No stored user - not logged in
      setLoading(false);
    }
  }, []);

  const refreshToken = async () => {
    await apiClient.post('/auth/refresh', {});
  };

  // Proactive token refresh - refresh tokens before they expire (every 14 minutes)
  // Access tokens expire in 15 minutes, so refresh at 14 minutes to prevent 401s
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        // Silently refresh token before it expires
        await refreshToken();
      } catch (error) {
        // If refresh fails, the interceptor will handle it on the next API call
        console.debug('Proactive token refresh failed (will retry on next request):', error);
      }
    }, 14 * 60 * 1000); // 14 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const verifyToken = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const u: User = res.data;
      setUser(u);
      localStorage.setItem('hms_user', JSON.stringify(u));
    } catch (error: any) {
      // Only log out if this is specifically an auth/me endpoint failure
      // Don't log out on other API errors
      const status = error?.response?.status;
      
      if (status === 401) {
        try {
          await refreshToken();
          const res = await apiClient.get('/auth/me');
          const u: User = res.data;
          setUser(u);
          localStorage.setItem('hms_user', JSON.stringify(u));
        } catch (refreshError: any) {
          // Refresh failed (400 = no token, 403 = expired/invalid)
          // Only log out if refresh truly failed - this means the session is invalid
          const refreshStatus = refreshError?.response?.status;
          if (refreshStatus === 400 || refreshStatus === 403) {
            // Only log out if we're not already on login page
            if (window.location.pathname !== '/login') {
              localStorage.removeItem('hms_user');
              setUser(null);
              window.location.href = '/login';
            }
          }
          // For other refresh errors (network issues, 500, etc.), don't log out
          // This prevents accidental logouts due to temporary server issues
          throw refreshError; // Re-throw to let caller handle
        }
      } else if (status === 403) {
        // 403 on /auth/me means user exists but token is invalid - log out
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('hms_user');
          setUser(null);
          window.location.href = '/login';
        }
        throw error; // Re-throw to let caller handle
      } else {
        // For other errors (network, 500, etc.), don't automatically log out
        // This could be a network issue or server error
        throw error; // Re-throw to let caller handle
      }
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const u: User = res.data;
      setUser(u);
      localStorage.setItem('hms_user', JSON.stringify(u));
    } catch (error: any) {
      // If refresh fails, try refreshing token first
      const status = error?.response?.status;
      if (status === 401) {
        try {
          await refreshToken();
          const res = await apiClient.get('/auth/me');
          const u: User = res.data;
          setUser(u);
          localStorage.setItem('hms_user', JSON.stringify(u));
        } catch (refreshError) {
          // If refresh still fails, just log the error but don't throw
          console.error('Failed to refresh user:', refreshError);
        }
      } else {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const login = async (username: string, password: string) => {
    const res = await apiClient.post('/auth/login', { username, password });
    const u: User = res.data.user;

    localStorage.setItem('hms_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      // Ignore errors on logout
    }
    localStorage.removeItem('hms_user');
    setUser(null);
    window.location.href = '/login';
  };

  const value: AuthContextValue = { user, loading, login, logout, refreshToken, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
