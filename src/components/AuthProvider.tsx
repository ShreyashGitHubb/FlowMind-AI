'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, signOut as fbSignOut } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await fbSignOut();
  };

  const isOrganizer = user?.email?.includes('admin') || user?.email?.includes('organizer') || user?.email === 'shreyasvishwakarma00@gmail.com' || false;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
