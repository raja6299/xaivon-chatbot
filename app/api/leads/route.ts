import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    console.log('[LEADS API] Request received');

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

    console.log('[LEADS API] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[LEADS API] Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const supabase = await getSupabaseClient();
    console.log('[LEADS API] Supabase client initialized');

    console.log('[LEADS API] Attempting database insert for:', email);
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
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    console.log('[LEADS API] Lead saved successfully, ID:', data?.[0]?.id);
    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    console.error('[LEADS API] FATAL ERROR:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}