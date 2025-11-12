import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set');
    // Return a mock client that will throw descriptive errors if actually used
    return {
      auth: {
        signOut: async () => {
          console.error('Supabase not configured: Cannot sign out');
          throw new Error('Supabase not configured: Cannot sign out');
        },
        getUser: async () => {
          console.error('Supabase not configured: Cannot get user');
          throw new Error('Supabase not configured: Cannot get user');
        },
        getSession: async () => {
          console.error('Supabase not configured: Cannot get session');
          throw new Error('Supabase not configured: Cannot get session');
        },
        signInWithPassword: async () => {
          console.error('Supabase not configured: Cannot sign in');
          throw new Error('Supabase not configured: Cannot sign in');
        },
        signUp: async () => {
          console.error('Supabase not configured: Cannot sign up');
          throw new Error('Supabase not configured: Cannot sign up');
        },
        updateUser: async () => {
          console.error('Supabase not configured: Cannot update user');
          throw new Error('Supabase not configured: Cannot update user');
        },
        resetPasswordForEmail: async () => {
          console.error('Supabase not configured: Cannot reset password');
          throw new Error('Supabase not configured: Cannot reset password');
        },
        resend: async () => {
          console.error('Supabase not configured: Cannot resend');
          throw new Error('Supabase not configured: Cannot resend');
        },
      },
      from: () => {
        console.error('Supabase not configured: Cannot access database');
        return {
          select: () => ({
            eq: () => ({
              single: () => {
                throw new Error('Supabase not configured: Cannot access database');
              }
            })
          })
        };
      },
      rpc: () => {
        console.error('Supabase not configured: Cannot call RPC');
        throw new Error('Supabase not configured: Cannot call RPC');
      }
    } as unknown as SupabaseClient;
  }
  
  const client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
  
  // Wrap the signOut method to add logging
  const originalSignOut = client.auth.signOut.bind(client.auth);
  client.auth.signOut = async () => {
    console.log('Supabase signOut method called');
    try {
      const result = await originalSignOut();
      console.log('Supabase signOut method completed', result);
      return result;
    } catch (error) {
      console.error('Supabase signOut method error', error);
      throw error;
    }
  };
  
  return client;
}