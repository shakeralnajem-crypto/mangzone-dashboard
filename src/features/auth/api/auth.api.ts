import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authApi = {
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Log the real Supabase error (RLS, network, JWT, etc.) for debugging,
      // but throw a recognizable code so LoginPage can show a useful message.
      console.error('[auth] getProfile error:', error.message, error);
      throw new Error('PROFILE_FETCH_ERROR');
    }

    if (!data) {
      throw new Error('PROFILE_MISSING');
    }

    const profile = data as Profile;

    if (!profile.is_active) {
      throw new Error('PROFILE_INACTIVE');
    }

    return profile;
  },
};
