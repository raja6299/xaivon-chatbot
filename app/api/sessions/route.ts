import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('[SESSIONS API] Creating new session');
    console.log('[SESSIONS API] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[SESSIONS API] Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const sessionId = uuidv4();
    const supabase = await getSupabaseClient();
    console.log('[SESSIONS API] Supabase client initialized');

    const { error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          id: sessionId,
          status: 'active',
          message_count: 0,
        },
      ])
      .select();

    if (error) {
      console.error('[SESSIONS API] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('[SESSIONS API] Session created:', sessionId);
    return NextResponse.json({ sessionId });

  } catch (error) {
    console.error('[SESSIONS API] FATAL ERROR:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}