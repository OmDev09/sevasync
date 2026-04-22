'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

/** Maximum time (ms) we wait for auth before we force-clear loading. */
const AUTH_TIMEOUT_MS = 10000;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Stable ref for the supabase client — never changes across renders.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Profile fetch error:', error.message);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // Safety net: if auth initialization takes too long, force-clear loading.
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn(`Auth initialization timed out after ${AUTH_TIMEOUT_MS}ms — force-clearing loading state.`);
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    async function loadInitialSession() {
      try {
        // STRATEGY: Use getSession() to read the session from cookies.
        // This is INSTANT (no network roundtrip) because the middleware
        // has already validated and refreshed the session server-side
        // via getUser() before the page loads.
        //
        // If getSession() fails due to NavigatorLockAcquireTimeoutError
        // (a known Supabase SDK issue on hard reload), we retry once
        // after a brief delay.
        let session = null;
        let retries = 2;

        while (retries > 0) {
          try {
            const result = await supabase.auth.getSession();
            session = result.data?.session ?? null;
            break; // Success — exit the retry loop.
          } catch (lockErr: any) {
            retries--;
            if (retries > 0 && lockErr?.message?.includes?.('Lock')) {
              // NavigatorLock error — wait briefly and retry.
              console.warn('Session lock contention detected, retrying...', lockErr.message);
              await new Promise(r => setTimeout(r, 500));
            } else {
              // Genuine error or exhausted retries.
              console.error('getSession failed:', lockErr);
              break;
            }
          }
        }

        if (!session?.user) {
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
        } else {
          const currentUser = session.user;
          if (mounted) setUser(currentUser);

          const p = await fetchProfile(currentUser.id);
          if (mounted) setProfile(p);
        }
      } catch (err) {
        console.error('Session init error:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      }
    }

    loadInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        // Skip INITIAL_SESSION — we handle it above in loadInitialSession.
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
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
    // supabase and fetchProfile are stable refs — this effect runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      // After sign-in, use getUser() to get the verified user from the server.
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
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return { success: false, error: 'An unexpected error occurred.' };
    }
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
    window.location.href = '/login';
  }, [supabase]);

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
