import { create } from 'zustand';
import { createClient } from "@/lib/supabase-client";
import { UserRole } from "@/types/enums";
import { User } from '@supabase/auth-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, role: null });
  },
  fetchUserProfile: async () => {
    try {
      const supabase = createClient();
      // Use getUser() instead of getSession() for security
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ user: null, profile: null, role: null, loading: false, initialized: true });
        return;
      }
      
      set({ user, loading: false });
      
      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        set({ profile: null, role: UserRole.STUDENT, initialized: true });
      } else {
        set({ profile: profile as Profile, role: profile.role as UserRole, initialized: true });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      set({ user: null, profile: null, role: UserRole.STUDENT, loading: false, initialized: true });
    }
  },
}));