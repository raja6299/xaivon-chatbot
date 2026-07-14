import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Attempts to get a Supabase client. Returns null if env vars are missing/placeholder.
 */
async function getSupabaseClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Detect placeholder values
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, company, phone, sessionId } = body;

    if (!fullName || !email) {
      console.error('[LEADS API] ERROR: Missing required fields');
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[LEADS API] ERROR: Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClientSafe();

    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            full_name: fullName,
            email: email,
            company: company || null,
            phone: phone || null,
            session_id: sessionId || null,
            status: 'new',
          },
        ])
        .select();

      if (error) {
        console.error('[LEADS API] Supabase error:', error.message);
        // If table doesn't exist, still return success with logged data
        if (error.code === '42P01') {
          console.warn('[LEADS API] Table "leads" does not exist. Lead logged to console.');
          console.log('[LEADS API] Lead data:', { fullName, email, company, phone, sessionId });
          return NextResponse.json({
            success: true,
            note: 'Lead received. Database table pending setup.',
          });
        }
        // For duplicate email+session constraint violations, still succeed
        if (error.code === '23505') {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json(
          { error: 'Failed to save lead' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        leadId: data?.[0]?.id,
      });
    } else {
      // Supabase not configured — log and succeed gracefully
      console.warn('[LEADS API] Supabase not configured. Logging lead to server output.');
      console.log('[LEADS API] Lead data:', JSON.stringify({ fullName, email, company, phone, sessionId }));
      return NextResponse.json({
        success: true,
        note: 'Lead received. Database connection pending configuration.',
      });
    }

  } catch (error) {
    console.error('[LEADS API] FATAL ERROR:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}