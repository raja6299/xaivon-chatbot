import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { signSessionId } from '@/lib/security/session';
import { checkRateLimit, logSecurity } from '@/lib/security';

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
  // Rate limiting on session creation: 20 per minute
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
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

    if (supabase) {
      await supabase
        .from('chat_sessions')
        .insert([
          {
            id: sessionId,
            status: 'active',
          },
        ]);
    }

    return NextResponse.json({ sessionId, sessionToken });
  } catch {
    return NextResponse.json({ sessionId, sessionToken });
  }
}