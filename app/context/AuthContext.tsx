'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (data) return data as Profile;
        if (error) console.warn(`Profile fetch attempt ${attempt + 1} failed:`, error.message);
      } catch (err) {
        console.warn(`Profile fetch attempt ${attempt + 1} exception:`, err);
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 500));
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    // Each effect invocation gets its own `cancelled` flag.
    // React Strict Mode runs effects twice in dev — the first cleanup
    // sets cancelled=true, so the first mount's async work is ignored.
    let cancelled = false;
    const abortController = new AbortController();

    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me', {
          signal: abortController.signal,
        });

        if (cancelled) return; // strict mode cleanup happened

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.user && data.profile) {
            setUser(data.user);
            setProfile(data.profile);
            setLoading(false);
            return;
          }
        }
      } catch (err: unknown) {
        // AbortError = strict mode cleanup aborted the fetch — completely normal, ignore
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Server session check failed, trying client fallback:', err);
      }

      // If server fetch failed (non-abort), try Supabase client as fallback
      if (cancelled) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user.id);
          if (!cancelled) {
            setProfile(p);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Nothing worked — user is genuinely not logged in
      if (!cancelled) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    loadSession();

    // Listen for FUTURE auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        if (event === 'INITIAL_SESSION') return;
        if (cancelled) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const p = await fetchProfile(currentUser.id);
          if (!cancelled) {
            setProfile(p);
            setLoading(false);
          }
        } else {
          if (!cancelled) {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      abortController.abort();
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: 'System profile missing.' };
      }
    }

    setLoading(false);
    return { success: false, error: 'Session failed.' };
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
