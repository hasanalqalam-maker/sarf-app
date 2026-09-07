'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  display_name: string | null;
  role: 'student' | 'teacher';
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: 'student' | 'teacher'
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

const PROFILE_COLUMNS = 'id, display_name, role, created_at';

async function selectProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/**
 * Load the caller's profile row. The `on_auth_user_created` trigger normally
 * creates it at signup; if that failed or hasn't fired yet, fall back to
 * inserting it here from the signup metadata (allowed by the
 * "Users can insert own profile" RLS policy).
 */
async function loadProfile(user: User): Promise<Profile | null> {
  const existing = await selectProfile(user.id);
  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const role = meta.role === 'teacher' || meta.role === 'student' ? meta.role : 'student';

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: (meta.display_name as string) ?? null,
      role,
    })
    .select(PROFILE_COLUMNS)
    .single();

  // A concurrent trigger insert wins the race → unique violation; re-read it.
  if (error) return selectProfile(user.id);
  return (data as Profile) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setProfile(await loadProfile(u));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        setProfile(u ? await loadProfile(u) : null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(
    email: string,
    password: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
    role: 'student' | 'teacher'
  ): Promise<{ error: string | null; needsConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // session is null when Supabase requires email confirmation
    return { error: null, needsConfirmation: !data.session };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, signIn, signUp, signOut, resetPassword, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
