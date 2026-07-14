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

    // 1. Validation
    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 2. Supabase Client Init
    const supabase = await getSupabaseClientSafe();

    if (!supabase) {
      console.error('[LEADS API] ERROR: Supabase client missing. Check env vars.');
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    // 3. Supabase Insert (Matches exact live schema expected after migration)
    const insertPayload = {
      name: fullName,
      email: email,
      company: company || null,
      phone: phone || null,
      session_id: sessionId || null,
      status: 'new',
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('[LEADS API] Supabase insert error:', error);
      
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        return NextResponse.json({ success: true, note: 'Lead already exists for this session' });
      }

      return NextResponse.json({ 
        error: `Database Error: ${error.message}` 
      }, { status: 500 });
    }

    // 4. Success
    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    console.error('[LEADS API] FATAL ERROR:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}