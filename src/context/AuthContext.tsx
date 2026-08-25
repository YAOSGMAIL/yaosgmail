import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserWithProfile, SystemSettings } from '../types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: UserWithProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  systemSettings: SystemSettings | null;
  login: (token: string, user: UserWithProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  const fetchPublicSettings = useCallback(async () => {
    const res = await api.get<SystemSettings>('/settings/public');
    if (res.data) {
      setSystemSettings(res.data);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get<UserWithProfile>('/auth/me');
      if (res.data) {
        setUser(res.data);
      } else {
        removeStoredToken();
        setUser(null);
        setToken(null);
      }
    } catch {
      removeStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicSettings();
    refreshUser();
  }, [fetchPublicSettings, refreshUser]);

  const login = (newToken: string, newUser: UserWithProfile) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        systemSettings,
        login,
        logout,
        refreshUser,
        refreshSettings: fetchPublicSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
