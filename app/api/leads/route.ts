import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazily initialize Supabase client inside the handler so missing env vars
// at build time (Next.js "collect page data") do not crash the build.
// Node.js runtime keeps the service-role key safely server-side.
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
    // Parse request body
    const body = await req.json();
    const { fullName, email, company, phone, sessionId } = body;

    // Server-side validation (required fields)
    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert lead into Supabase database
    console.log('Lead submission:', { email, fullName, sessionId, timestamp: new Date().toISOString() });

    const supabase = getSupabase();

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

    // Handle Supabase errors
    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json(
        { error: 'Failed to save lead. Please try again later.' },
        { status: 500 }
      );
    }

    // Success response
    console.log('Lead saved successfully:', data?.[0]?.id);
    return NextResponse.json({
      success: true,
      message: 'Lead saved successfully',
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead submission' },
      { status: 500 }
    );
  }
}