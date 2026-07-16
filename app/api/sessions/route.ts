import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

/**
 * Attempts to get a Supabase client. Returns null if env vars are missing/placeholder.
 */
async function getSupabaseClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRoleKey ||
    url.includes('your_supabase') ||
    serviceRoleKey.includes('your_supabase')
  ) {
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, serviceRoleKey);
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const sessionId = uuidv4();
    const supabase = await getSupabaseClientSafe();

    if (supabase) {
      const { error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            id: sessionId,
            status: 'active',
          },
        ])
        .select();

      if (error) {
        // Still return the session ID even if DB insert fails
      }
    }

    return NextResponse.json({ sessionId });

  } catch {
    // Always return a valid session ID, even on error
    return NextResponse.json({ sessionId: uuidv4() });
  }
}