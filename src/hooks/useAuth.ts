import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('Auth timeout - forcing loading to false');
          setLoading(false);
        }
      }, 3000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setUser(null);
          setProfile(null);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .maybeSingle();

          if (isMounted) {
            if (profileError) {
              console.error('Profile error:', profileError);
            }
            setProfile(profileData || { is_admin: false });
          }
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          (async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .maybeSingle();

              if (isMounted) {
                if (profileError) {
                  console.error('Profile error on auth change:', profileError);
                }
                setProfile(profileData || { is_admin: false });
              }
            } catch (error) {
              console.error('Auth state change error:', error);
              if (isMounted) {
                setProfile(null);
              }
            }
          })();
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
  };
}
