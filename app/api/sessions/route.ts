import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const sessionId = uuidv4();
    const supabase = await getSupabaseClient();

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
      console.error('Session creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}