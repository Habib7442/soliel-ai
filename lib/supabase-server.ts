import {
  createServerClient as supabaseCreateServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (App Router, RSC / Server Actions).
 * Uses the new batch cookie API: getAll / setAll
 */
export async function createServerClient() {
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return early if environment variables are not set (e.g., during static generation)
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will throw errors if actually used
    const mockClient = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("Supabase not configured"),
        }),
        getSession: async () => ({
          data: { session: null },
          error: new Error("Supabase not configured"),
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: new Error("Supabase not configured"),
        }),
        signUp: async () => ({
          data: { user: null, session: null },
          error: new Error("Supabase not configured"),
        }),
        signOut: async () => ({ error: new Error("Supabase not configured") }),
        updateUser: async () => ({
          data: { user: null },
          error: new Error("Supabase not configured"),
        }),
        resetPasswordForEmail: async () => ({
          error: new Error("Supabase not configured"),
        }),
        resend: async () => ({ error: new Error("Supabase not configured") }),
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: string | number) => ({
            single: () => ({
              data: null,
              error: new Error("Supabase not configured"),
            }),
            order: (column: string, options?: { ascending?: boolean }) => ({
              eq: (column: string, value: string | number) => ({
                single: () => ({
                  data: null,
                  error: new Error("Supabase not configured"),
                }),
              }),
            }),
          }),
          order: (column: string, options?: { ascending?: boolean }) => ({
            eq: (column: string, value: string | number) => ({
              single: () => ({
                data: null,
                error: new Error("Supabase not configured"),
              }),
            }),
          }),
        }),
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            data: null,
            error: new Error("Supabase not configured"),
          }),
        }),
        update: (values: Record<string, unknown>) => ({
          eq: (column: string, value: string | number) => ({
            select: () => ({
              data: null,
              error: new Error("Supabase not configured"),
            }),
          }),
        }),
        delete: () => ({
          eq: (column: string, value: string | number) => ({
            data: null,
            error: new Error("Supabase not configured"),
          }),
        }),
      }),
      rpc: (functionName: string, params?: Record<string, unknown>) => ({
        data: null,
        error: new Error("Supabase not configured"),
      }),
    };

    return mockClient as unknown as SupabaseClient;
  }

  const cookieStore = await cookies(); // <-- await in Next 15+

  return supabaseCreateServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
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
  });
}

/**
 * Admin Supabase client with service role key for bypassing RLS
 */
export async function createAdminClient() {
  // Check if service role key is available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Return early if environment variables are not set (e.g., during static generation)
  if (!supabaseUrl || !serviceRoleKey) {
    // Return a mock client that will throw errors if actually used
    const mockClient = {
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("Supabase not configured"),
        }),
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: string | number) => ({
            single: () => ({
              data: null,
              error: new Error("Supabase not configured"),
            }),
          }),
        }),
      }),
    };

    return mockClient as unknown as SupabaseClient;
  }

  if (!serviceRoleKey) {
    console.warn("Service role key not found, falling back to regular client");
    return createServerClient();
  }

  return supabaseCreateServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      },
    },
  });
}
