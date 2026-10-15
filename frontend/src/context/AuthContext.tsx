import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { api, setToken, removeToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start logged out by default unless authenticated
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('ordershield_token');
    const saved = localStorage.getItem('ordershield_active_user');
    // If it was a mock demo token from before, clear it so user lands on login page
    if (token && token.startsWith('demo-token-')) {
      localStorage.removeItem('ordershield_token');
      localStorage.removeItem('ordershield_active_user');
      return null;
    }
    if (token && saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('ordershield_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ordershield_active_user');
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, fullName: string, phone?: string) => {
    const res = await api.auth.register({ email, password: pass, fullName, phone });
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('ordershield_active_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ROLE_ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
