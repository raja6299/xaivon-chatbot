/**
 * Shared lazy-loaded Supabase client for server-side API routes.
 * Uses dynamic import to avoid build-time crashes when env vars are missing.
 */
export async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(url, serviceRoleKey);
}
