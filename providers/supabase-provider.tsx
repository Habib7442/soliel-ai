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
      const errorMessage = typeof args[0] === 'string' ? args[0] : args[0]?.message || '';
      const errorName = args[0]?.name || '';
      
      if (
        errorMessage.includes("Auth session missing!") ||
        errorMessage.includes("AuthSessionMissingError") ||
        errorName === "AuthSessionMissingError" ||
        errorMessage.includes("A tree hydrated but some attributes") ||
        errorMessage.includes("Hydration failed because")
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
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            setUser(null);
          } else {
            setUser(user);
          }
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          setSession(session);
        } catch (error: any) {
          console.error('❌ [SupabaseProvider] Critical error in fetchUser:', error);
          setUser(null);
          setSession(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
          // Handle SIGNED_OUT event immediately
          if (_event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            // Refresh the router to update UI
            router.refresh();
            return;
          }
          
          // Use getUser() instead of relying on session.user for security
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            // Only log if it's not an auth session missing error
            if (!error.message?.includes('Auth session missing')) {
              console.error('Error fetching user on auth state change:', error);
            }
            setUser(null);
          } else {
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
        router.refresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [router, supabase]);

  // Safety net: Force loading to false after a timeout to prevent stuck UI
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ [SupabaseProvider] Auth check timed out (10s), forcing loading to false. This may happen on slow connections.");
        setLoading(false);
      }
    }, 10000); // 10 seconds safety timeout
    return () => clearTimeout(timer);
  }, [loading]);

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