import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '../api/auth.api';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // SIGNED_IN is handled directly by LoginPage — ignore it here to avoid
      // a race where this listener overwrites the store after LoginPage already
      // navigated away.
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        return;
      }

      // INITIAL_SESSION: app loaded with a persisted session (e.g. page refresh).
      // Restore auth state from Supabase.
      if (event === 'INITIAL_SESSION') {
        if (!session) {
          clearAuth();
          return;
        }
        try {
          const profile = await authApi.getProfile(session.user.id);
          setAuth(session.user, profile);
        } catch (err) {
          console.error('[auth] INITIAL_SESSION profile fetch failed:', err);
          await authApi.logout().catch(() => {});
          clearAuth();
        }
        return;
      }

      // SIGNED_OUT — always clear
      if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

  return <>{children}</>;
}
