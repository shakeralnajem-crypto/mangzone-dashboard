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
      // SIGNED_IN is handled directly by LoginPage to avoid a race where this
      // listener would overwrite the store after LoginPage already navigated.
      if (event === 'SIGNED_IN') return;

      // INITIAL_SESSION: page refresh with a persisted session.
      // TOKEN_REFRESHED: JWT auto-renewed (~55 min). Re-hydrate profile so that
      // clinicId stays valid in the store — without this, dormant tabs end up
      // with clinicId = null and all data queries return empty.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (!session) {
          clearAuth();
          return;
        }
        // Skip re-fetch on TOKEN_REFRESHED if profile is already loaded —
        // avoids an unnecessary DB round-trip every hour.
        if (event === 'TOKEN_REFRESHED' && useAuthStore.getState().profile) {
          return;
        }
        try {
          const profile = await authApi.getProfile(session.user.id);
          setAuth(session.user, profile);
        } catch (err) {
          console.error(`[auth] ${event} profile fetch failed:`, err);
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
