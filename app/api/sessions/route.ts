import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Lazily initialize Supabase client inside the handler so missing env vars
// at build time (Next.js "collect page data") do not crash the build.
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(url, serviceRoleKey);
}

export async function POST(req: Request) {
  try {
    const sessionId = uuidv4();

    const supabase = getSupabase();

    const { data, error } = await supabase
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
      console.error('Session creation error:', error.message);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('Session created:', sessionId);
    return NextResponse.json({ sessionId });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}