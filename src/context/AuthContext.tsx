import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

interface AuthUser {
  id: string;
  email: string;
  [key: string]: any;
}

interface AuthCtx {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  updateUser: (patch: Record<string, any>) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

const STORAGE_KEY = 'gh_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id) {
      api.getUser(id).then(r => setUser(r.user)).catch(() => localStorage.removeItem(STORAGE_KEY)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) localStorage.setItem(STORAGE_KEY, user.id);
  }, [user?.id]);

  async function updateUser(patch: Record<string, any>) {
    if (!user) return;
    const { user: updated } = await api.updateUser(user.id, patch);
    setUser(updated);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, setUser, updateUser, signOut, loading }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
