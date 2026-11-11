import { createContext, ReactNode, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthState = {
  user: User | null;
  profile: { is_admin: boolean } | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
};

export const AuthContext = createContext<AuthState | null>(null);

// Une seule session pour tout le site : avant, chaque composant qui utilisait
// useAuth (dont chaque bloc de commentaires) relisait la session et le profil.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();
      if (error) console.error('Profile error:', error);
      if (isMounted) setProfile(data || { is_admin: false });
    };

    // Filet de sécurité : ne pas bloquer l'affichage si Supabase ne répond pas
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) console.error('Session error:', error);
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
      })
      .catch((error) => console.error('Auth error:', error))
      .finally(() => {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        // Hors du rappel (recommandation Supabase) pour éviter un blocage
        setTimeout(() => { loadProfile(session.user.id); }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin: profile?.is_admin === true, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
