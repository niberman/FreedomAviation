'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function clearSessionOnInvalidRefresh(error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (/Refresh Token|Invalid Refresh Token/i.test(message)) {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setSession(null);
        setUser(null);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Error getting initial session:', error);
        clearSessionOnInvalidRefresh(error);
      }
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('[AuthContext] Failed to get initial session:', err);
      clearSessionOnInvalidRefresh(err);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth event:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle PASSWORD_RECOVERY event - redirect to reset password page
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[AuthContext] PASSWORD_RECOVERY event detected, redirecting to /reset-password');
        window.location.href = '/reset-password';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Use scope: 'local' to clear only this device's session without calling the server.
      // This avoids 403 when the session is already invalid/revoked (e.g. "auth session missing").
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.warn('[AuthContext] Sign out error (clearing local state anyway):', error.message);
      }
    } catch (err) {
      console.warn('[AuthContext] Sign out threw (clearing local state anyway):', err);
    } finally {
      // Always clear local state so the UI shows logged out even if the server returned 403 or threw.
      setSession(null);
      setUser(null);
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
