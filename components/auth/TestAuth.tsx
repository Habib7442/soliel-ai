"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
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
  authenticated: boolean;
  user?: User;
  profile?: Profile;
  message?: string;
  error?: string;
}

export default function TestAuth() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchAuthState = async () => {
      try {
        // Use getUser() instead of getSession() for security
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAuthState({ authenticated: false, message: "No user found" });
          setLoading(false);
          return;
        }
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setAuthState({ 
          authenticated: true, 
          user: user,
          profile: profile
        });
      } catch (error) {
        console.error("Error fetching auth state:", error);
        setAuthState({ authenticated: false, error: "Failed to fetch auth state" });
      } finally {
        setLoading(false);
      }
    };

    fetchAuthState();
  }, []);

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">Loading authentication state...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="text-lg font-semibold mb-2">Authentication Test</h3>
      <pre className="text-sm bg-white p-2 rounded overflow-auto">
        {JSON.stringify(authState, null, 2)}
      </pre>
    </div>
  );
}