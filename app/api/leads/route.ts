import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { checkRateLimit, sanitizeInput, leadRequestSchema, logAnalytics, logSecurity } from '@/lib/security';

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
    // 1. Rate Limiting (Sliding Window: 5 requests per minute per IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    const rateLimit = checkRateLimit(`leads_${ip}`, 5, 60_000);
    if (!rateLimit.success) {
      logSecurity('RateLimitExceeded', { ip, endpoint: '/api/leads' });
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60)
          }
        }
      );
    }

    // 2. Validate and Sanitize Input using Zod
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      logSecurity('InvalidJSON', { ip });
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validationResult = leadRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logSecurity('ValidationError', { ip, errors: validationResult.error.format() });
      return NextResponse.json({ error: 'Invalid request format or oversized payload' }, { status: 400 });
    }

    const body = validationResult.data;

    // 3. Honeypot check: if website field is filled, silently succeed
    if (body.website) {
      logSecurity('HoneypotTriggered', { ip, field: 'website' });
      return NextResponse.json({ success: true });
    }

    // 4. Sanitize all inputs
    const fullName = sanitizeInput(body.fullName);
    const email = sanitizeInput(body.email);
    const company = sanitizeInput(body.company);
    const phone = body.phone ? sanitizeInput(body.phone) : '';
    const sessionId = body.sessionId ? sanitizeInput(body.sessionId) : '';

    const cleanEmail = email.toLowerCase();

    // Phone: optional, strict international validation
    let cleanPhone: string | null = null;
    if (phone) {
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json({ error: 'Please enter a valid international phone number.' }, { status: 400 });
      }
      cleanPhone = phone.trim();
    }

    // Supabase Client Init
    const supabase = await getSupabaseClientSafe();

    if (!supabase) {
      logSecurity('MissingSupabase', { endpoint: '/api/leads' });
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    // 5. Duplicate Lead Detection
    let orQuery = `email.eq.${cleanEmail},company.eq.${company}`;
    if (cleanPhone) {
      orQuery += `,phone.eq.${cleanPhone}`;
    }

    try {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .or(orQuery)
        .limit(1);

      if (existingLead && existingLead.length > 0) {
        logAnalytics('DuplicateLeadPrevented', { email: cleanEmail, company });
        return NextResponse.json({ success: true, note: 'You\'re already in touch with our team.' });
      }
    } catch (dbError) {
      logSecurity('SupabaseError', { action: 'DuplicateCheck', error: String(dbError) });
      // Proceed gracefully even if duplicate check fails
    }

    // Insert (matches exact live schema)
    const insertPayload = {
      name: fullName,
      email: cleanEmail,
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

    // Process Enterprise CRM Payload (Phase 5)
    // Run securely on the server. If it fails, do not block lead submission.
    if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
      setImmediate(async () => {
        try {
          const { processLeadForCRM } = await import('@/lib/crm');
          await processLeadForCRM(body, body.messages!, sessionId);
        } catch (crmError) {
          logSecurity('CRMProcessingError', { error: String(crmError) });
        }
      });
    }

    logAnalytics('LeadSubmitted', { 
      ip, 
      company,
      hasPhone: !!cleanPhone,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
    });

  } catch (error) {
    logSecurity('ServerError', { endpoint: '/api/leads', error: String(error) });
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}