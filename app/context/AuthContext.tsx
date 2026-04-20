'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/database.types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const ROLE_HOME: Record<string, string> = {
  'super-admin': '/super-admin',
  'admin': '/admin',
  'volunteer': '/volunteer',
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data as Profile | null;
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (mounted) setUser(currentUser);
        
        if (currentUser) {
          const p = await fetchProfile(currentUser.id);
          if (mounted) setProfile(p);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'INITIAL_SESSION') return;
        try {
          const currentUser = session?.user ?? null;
          if (mounted) setUser(currentUser);
          
          if (currentUser) {
            const p = await fetchProfile(currentUser.id);
            if (mounted) setProfile(p);
          } else {
            if (mounted) setProfile(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      const p = await fetchProfile(currentUser.id);
      if (p) {
        setProfile(p);
        router.push(ROLE_HOME[p.role] ?? '/');
      }
    }

    setLoading(false);
    return { success: true };
  }, [supabase, router, fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn('SignOut error ignored:', err);
    }
    setUser(null);
    setProfile(null);
    router.push('/login');
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
