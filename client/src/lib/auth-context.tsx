import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to get initial session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'session present' : 'no session');
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        // User signed out - clear state
        setSession(null);
        setUser(null);
        setLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery - Supabase automatically processes tokens from URL hash
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else if (event === 'SIGNED_IN') {
        // User signed in
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Session refreshed successfully
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else if (event === 'USER_UPDATED') {
        // User data updated
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } else {
        // Any other event - update state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Immediately update the auth state to prevent race condition
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
  };

  const signInWithGoogle = async () => {
    // Get the base URL for redirects
    let baseUrl = window.location.origin;
    
    // In production, ensure we use www domain if applicable
    if (window.location.hostname === 'freedomaviationco.com') {
      baseUrl = 'https://www.freedomaviationco.com';
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/login`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Use 'global' scope to sign out from all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        // If we get a 403 or other error, still clear local state
        // This prevents logout loops when the server session is already invalid
        console.warn('Sign out error (clearing local state anyway):', error);
        
        // Manually clear local state
        setSession(null);
        setUser(null);
        
        // Only throw if it's not a 403/session error
        if (!error.message?.includes('403') && !error.message?.includes('session')) {
          throw error;
        }
      }
    } catch (err) {
      console.error('Sign out exception:', err);
      // Always clear local state even on error
      setSession(null);
      setUser(null);
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const resetPasswordForEmail = async (email: string) => {
    // Use the full URL with hash support - Supabase will append tokens to the hash
    // Make sure we use www domain in production to match the redirect URL configured in Supabase
    let baseUrl = window.location.origin;
    
    // In production, ensure we use www domain
    if (window.location.hostname === 'freedomaviationco.com') {
      baseUrl = 'https://www.freedomaviationco.com';
    }
    
    const redirectUrl = `${baseUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, signOut, updatePassword, resetPasswordForEmail }}>
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
