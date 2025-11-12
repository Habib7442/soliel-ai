import { createServerClient as supabaseCreateServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-only Supabase client (App Router, RSC / Server Actions).
 * Uses the new batch cookie API: getAll / setAll
 */
export async function createServerClient() {
  const cookieStore = await cookies(); // <-- await in Next 15+

  return supabaseCreateServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  
  if (!serviceRoleKey) {
    console.warn('Service role key not found, falling back to regular client');
    return createServerClient();
  }
  
  return supabaseCreateServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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