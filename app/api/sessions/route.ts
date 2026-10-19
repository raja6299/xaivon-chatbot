import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

export async function POST() {
  const sessionId = uuidv4();
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

    return NextResponse.json({ sessionId });
  } catch {
    return NextResponse.json({ sessionId });
  }
}