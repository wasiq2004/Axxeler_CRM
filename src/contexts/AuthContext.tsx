import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  // Start in a loading state when a token is present so route guards wait for the
  // profile (and therefore the role) to hydrate before evaluating access.
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('token'));
  const [error, setError] = useState<string | null>(null);
  const { crmApi } = useApi();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      setIsAuthenticated(true);
      crmApi.setToken(token);
      crmApi.getProfile()
        .then((response) => {
          const profile = response.data || response;
          setUser(profile);
          localStorage.setItem('user_role', profile.role);
          localStorage.setItem('user_email', profile.email);
        })
        .catch(() => {
          // Profile fetch failed — token is invalid or server is unreachable; clear auth state
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_email');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [crmApi]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await crmApi.login({ email, password });
      const payload = response.data || response;
      const loggedInUser = payload.user;
      const accessToken = payload.accessToken;
      const refreshToken = payload.refreshToken;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user_role', loggedInUser.role);
      localStorage.setItem('user_email', loggedInUser.email);
      
      setToken(accessToken);
      setIsAuthenticated(true);
      crmApi.setToken(accessToken);
      setUser(loggedInUser);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await crmApi.signup({ email, password, name });
      const payload = response.data || response;
      localStorage.setItem('token', payload.accessToken);
      localStorage.setItem('refreshToken', payload.refreshToken);
      localStorage.setItem('user_role', payload.user.role);
      localStorage.setItem('user_email', payload.user.email);
      setToken(payload.accessToken);
      setIsAuthenticated(true);
      crmApi.setToken(payload.accessToken);
      setUser(payload.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch the current user so app chrome (Header, etc.) reflects profile
  // edits like a new avatar/name without a full page reload.
  const refreshUser = async () => {
    try {
      const response = await crmApi.getProfile();
      const profile = response.data || response;
      setUser(profile);
      if (profile?.role) localStorage.setItem('user_role', profile.role);
      if (profile?.email) localStorage.setItem('user_email', profile.email);
    } catch {
      // ignore — keep current user state
    }
  };

  const logout = () => {
    // Revoke the server-side session (best effort — don't block local sign-out).
    crmApi.logout?.().catch(() => undefined);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    crmApi.setToken(null);
  };

  // When the API layer exhausts token refresh (refresh token expired/revoked),
  // it dispatches `auth:unauthorized` — clear auth state so the user is sent to login.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, loading: isLoading, error, login, logout, signup, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
