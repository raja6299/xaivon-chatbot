import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, company, phone, sessionId } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();

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
      console.error('Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}