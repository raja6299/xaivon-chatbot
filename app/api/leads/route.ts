"use client";

import { NextResponse } from 'next/server';

// Node.js runtime for Supabase service key (not exposed in edge)

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { fullName, email, company, phone, session_id } = body;

    // Server-side validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (company !== undefined && typeof company !== 'string') {
      return NextResponse.json(
        { error: 'Company must be a string' },
        { status: 400 }
      );
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone must be a string' },
        { status: 400 }
      );
    }

    // Log the submission for debugging
    console.log('Lead submission received:', {
      email: email.trim(),
      timestamp: new Date().toISOString(),
      session_id: session_id || null,
    });

    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Import Supabase client only on server side
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert lead into database
    const { data, error } = await supabase
      .from('leads')
      .insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        session_id: session_id || null,
        status: 'new',
      })
      .select();

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email has already been submitted' },
          { status: 400 }
        );
      }

      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save lead. Please try again.' },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      { success: true, message: 'Lead saved successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}