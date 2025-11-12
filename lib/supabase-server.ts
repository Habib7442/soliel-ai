import { createServerClient as supabaseCreateServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client (App Router, RSC / Server Actions).
 * Uses the new batch cookie API: getAll / setAll
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if environment variables are available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set');
    // Return a mock client that will throw descriptive errors if actually used
    return {
      auth: {
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
        signOut: async () => {
          console.error('Supabase not configured: Cannot sign out');
          throw new Error('Supabase not configured: Cannot sign out');
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

  const cookieStore = await cookies(); // <-- await in Next 15+

  return supabaseCreateServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // You're likely in a Server Component, where setting cookies throws.
            // Safe to ignore if you refresh sessions in middleware/route handlers.
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase client with service role key for bypassing RLS
 */
export async function createAdminClient() {
  // Check if service role key is available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Check if environment variables are available
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('Supabase environment variables are not set');
    // Return a mock client that will throw descriptive errors if actually used
    return {
      auth: {
        getUser: async () => {
          console.error('Supabase not configured: Cannot get user');
          throw new Error('Supabase not configured: Cannot get user');
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
    } as unknown as SupabaseClient;
  }
  
  if (!serviceRoleKey) {
    console.warn('Service role key not found, falling back to regular client');
    return createServerClient();
  }
  
  return supabaseCreateServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for admin client
        },
      },
    }
  );
}