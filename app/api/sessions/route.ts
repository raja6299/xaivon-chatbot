import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { signSessionId } from '@/lib/security/session';
import { checkRateLimit, logSecurity, getTrustedClientIp } from '@/lib/security';

export const runtime = 'nodejs';

async function getSupabaseClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceRoleKey ||
    url.includes('dummy') ||
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

export async function POST(req: Request) {
  // Rate limiting on session creation: 20 per minute using trusted edge IP
  const ip = getTrustedClientIp(req);
  const rateLimit = checkRateLimit(`sessions_${ip}`, 20, 60_000);

  if (!rateLimit.success) {
    logSecurity('RateLimitExceeded', { ip, endpoint: '/api/sessions' });
    return NextResponse.json(
      { error: 'Too many session requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }

  const sessionId = uuidv4();
  const sessionToken = signSessionId(sessionId);

  try {
    const supabase = await getSupabaseClientSafe();
    let persisted = false;

    if (supabase) {
      const { error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            id: sessionId,
            status: 'active',
          },
        ]);

      if (error) {
        logSecurity('SupabaseSessionInsertError', { code: error.code || 'DB_INSERT_FAILED' });
        if (process.env.REQUIRE_PERSISTENCE === 'true') {
          return NextResponse.json(
            { error: 'Persistent session storage unavailable. Please try again later.' },
            { status: 503 }
          );
        }
      } else {
        persisted = true;
      }
    }

    return NextResponse.json({
      sessionId,
      sessionToken,
      persisted,
      mode: persisted ? 'persistent' : 'stateless_in_memory'
    });
  } catch {
    logSecurity('SessionCreationException', { code: 'INTERNAL_EXCEPTION' });
    return NextResponse.json({
      sessionId,
      sessionToken,
      persisted: false,
      mode: 'stateless_in_memory'
    });
  }
}