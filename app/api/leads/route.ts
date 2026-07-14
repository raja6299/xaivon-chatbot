import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Rate limiting: simple in-memory store (resets on cold start, sufficient for serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 submissions per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  return false;
}

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/<[^>]*>/g, '').slice(0, 500);
}

function hasMinLetters(value: string, min: number): boolean {
  const letters = value.replace(/[^a-zA-Z\u00C0-\u024F\u0400-\u04FF]/g, '');
  return letters.length >= min;
}

/**
 * Attempts to get a Supabase client. Returns null if env vars are missing/placeholder.
 */
async function getSupabaseClientSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    // Rate limiting by IP
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check: if website field is filled, silently succeed
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    // Sanitize all inputs
    const fullName = sanitize(body.fullName);
    const email = sanitize(body.email);
    const company = sanitize(body.company);
    const phone = sanitize(body.phone);
    const sessionId = sanitize(body.sessionId);

    // Server-side validation — NEVER trust client

    // Name: required, 2-60 chars, must contain at least 2 letters
    if (!fullName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (fullName.length < 2 || fullName.length > 60) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 60 characters' },
        { status: 400 }
      );
    }
    if (!hasMinLetters(fullName, 2)) {
      return NextResponse.json({ error: 'Please enter a valid name' }, { status: 400 });
    }

    // Email: required, valid format
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid business email' }, { status: 400 });
    }

    // Company: required, 2-100 chars, must contain at least 2 letters
    if (!company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    if (company.length < 2 || company.length > 100) {
      return NextResponse.json(
        { error: 'Company name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }
    if (!hasMinLetters(company, 2)) {
      return NextResponse.json({ error: 'Please enter a valid company name' }, { status: 400 });
    }

    // Phone: optional, but if provided must be 7-15 digits
    let cleanPhone: string | null = null;
    if (phone) {
      const hasPlus = phone.startsWith('+');
      const digitsOnly = phone.replace(/\D/g, '');

      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number (7-15 digits)' },
          { status: 400 }
        );
      }

      // Check for repeating single digit (e.g. 1111111)
      if (/^(\d)\1+$/.test(digitsOnly)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }

      cleanPhone = hasPlus ? `+${digitsOnly}` : digitsOnly;
    }

    // Supabase Client Init
    const supabase = await getSupabaseClientSafe();

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    // Insert (matches exact live schema)
    const insertPayload = {
      name: fullName,
      email: email,
      company: company,
      phone: cleanPhone,
      session_id: sessionId || null,
      status: 'new',
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([insertPayload])
      .select();

    if (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        return NextResponse.json({ success: true, note: 'Lead already exists for this session' });
      }

      return NextResponse.json(
        { error: `Database Error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}