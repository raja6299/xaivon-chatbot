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
  let currentStage = 'init';
  try {
    // 1. Parsing
    currentStage = 'parsing_request';
    const body = await req.json();
    const { fullName, email, company, phone, sessionId } = body;

    // 2. Validation
    currentStage = 'validation';
    if (!fullName || !email) {
      return NextResponse.json({ stage: currentStage, error: 'Full name and email are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ stage: currentStage, error: 'Invalid email format' }, { status: 400 });
    }

    // 3. Supabase Client Init
    currentStage = 'supabase_client_init';
    const supabase = await getSupabaseClientSafe();

    if (!supabase) {
      currentStage = 'supabase_client_missing_graceful_fallback';
      console.warn('[LEADS API] Supabase not configured. Logging lead to server output.');
      console.log('[LEADS API] Lead data:', JSON.stringify({ fullName, email, company, phone, sessionId }));
      return NextResponse.json({
        stage: currentStage,
        success: true,
        note: 'Lead received. Database connection pending configuration.',
      });
    }

    // 4. Supabase Insert
    currentStage = 'supabase_insert';
    const insertPayload = {
      full_name: fullName,
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
      currentStage = 'supabase_insert_error';
      
      // If table doesn't exist, still return success with logged data
      if (error.code === '42P01') {
        console.warn('[LEADS API] Table "leads" does not exist. Lead logged to console.');
        console.log('[LEADS API] Lead data:', insertPayload);
        return NextResponse.json({
          stage: currentStage,
          success: true,
          note: 'Lead received. Database table pending setup.',
        });
      }
      
      // For duplicate email+session constraint violations, still succeed
      if (error.code === '23505') {
        return NextResponse.json({ stage: currentStage, success: true });
      }

      return NextResponse.json({
        stage: currentStage,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload: insertPayload
      }, { status: 500 });
    }

    // 5. Success Response
    currentStage = 'response';
    return NextResponse.json({
      stage: currentStage,
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    return NextResponse.json({
      stage: currentStage,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}