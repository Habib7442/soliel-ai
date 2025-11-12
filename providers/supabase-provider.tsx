"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { type Session, type User } from '@supabase/supabase-js';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      // Use getUser() instead of getSession() for security
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Also get session for backward compatibility
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Use getUser() instead of relying on session.user for security
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setSession(session);
      setLoading(false);
      
      // Refresh the page when auth state changes to ensure components update
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ user, session, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}