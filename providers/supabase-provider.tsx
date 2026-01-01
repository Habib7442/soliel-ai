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
  
  // Only create the client on the client side
  const supabase = typeof window !== 'undefined' ? createClient() : null;

  useEffect(() => {
    // Suppress specific console errors
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args[0]?.includes?.("Auth session missing!") ||
        args[0]?.includes?.("A tree hydrated but some attributes") ||
        args[0]?.includes?.("Hydration failed because")
      ) {
        return;
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && supabase) {
      const fetchUser = async () => {
        try {
          // Use getUser() instead of getSession() for security
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            console.error('Error fetching user:', error);
            setUser(null);
          } else {
            setUser(user);
          }
          
          // Also get session for backward compatibility
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Error fetching session:', sessionError);
            setSession(null);
          } else {
            setSession(session);
          }
        } catch (error) {
          console.error('Error in fetchUser:', error);
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state change event:', _event, session);
        try {
          // Handle SIGNED_OUT event immediately
          if (_event === 'SIGNED_OUT') {
            console.log('User signed out, clearing user state');
            setUser(null);
            setSession(null);
            // Refresh the router to update UI
            router.refresh();
            return;
          }
          
          // Use getUser() instead of relying on session.user for security
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            console.error('Error fetching user on auth state change:', error);
            setUser(null);
          } else {
            console.log('User fetched on auth state change:', user);
            setUser(user);
          }
          setSession(session);
        } catch (error) {
          console.error('Error in onAuthStateChange:', error);
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
        
        // Refresh the page when auth state changes to ensure components update
        console.log('Refreshing router after auth state change');
        router.refresh();
      });

      return () => {
        console.log('Unsubscribing from auth state change');
        subscription.unsubscribe();
      };
    } else {
      // Set loading to false immediately if not on client side
      setLoading(false);
    }
  }, [router, supabase]);

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