import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  countryOfOrigin: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot' | 'bootstrap';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot' | 'bootstrap') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { fullName?: string; countryOfOrigin?: string; profilePhoto?: string | null }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; demoResetCode?: string }>;
  resetPassword: (code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  bootstrapAdmin: (secretKey: string, email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aogim_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot' | 'bootstrap'>('login');

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' | 'bootstrap' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('aogim_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token invalid or expired
        localStorage.removeItem('aogim_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to verify token', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }

      localStorage.setItem('aogim_token', data.token);
      setToken(data.token);
      setUser(data.user);
      closeAuthModal();
      return { success: true };
    } catch {
      return { success: false, error: 'Connection failed. Please check your network.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to create account' };
      }

      localStorage.setItem('aogim_token', resData.token);
      setToken(resData.token);
      setUser(resData.user);
      closeAuthModal();
      return { success: true };
    } catch {
      return { success: false, error: 'Connection failed. Please check your network.' };
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('aogim_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.error('Logout error', err);
      }
    }
    localStorage.removeItem('aogim_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { fullName?: string; countryOfOrigin?: string; profilePhoto?: string | null }) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to update profile' };
      }
      setUser(resData.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error updating profile' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to change password' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error changing password' };
    }
  };

  const deleteAccount = async () => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to delete account' };
      }
      localStorage.removeItem('aogim_token');
      setToken(null);
      setUser(null);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error deleting account' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const resData = await res.json();
      return {
        success: res.ok,
        error: resData.error,
        demoResetCode: resData.demoResetCode,
      };
    } catch {
      return { success: false, error: 'Network error sending reset request' };
    }
  };

  const resetPassword = async (code: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCode: code, newPassword }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to reset password' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error resetting password' };
    }
  };

  const bootstrapAdmin = async (secretKey: string, email: string) => {
    try {
      const res = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey, email }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Bootstrap failed' };
      }
      await refreshUser();
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during admin configuration' };
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = Boolean(
    user && ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'FINANCE_MANAGER'].includes(user.role)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isSuperAdmin,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        forgotPassword,
        resetPassword,
        bootstrapAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
