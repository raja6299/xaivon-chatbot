import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { isValidPhoneNumber } from 'libphonenumber-js';
import { checkRateLimit, sanitizeInput, leadRequestSchema, logAnalytics, logSecurity, maskEmail, getTrustedClientIp } from '@/lib/security';
import { verifySessionToken } from '@/lib/security/session';

/**
 * Attempts to get a Supabase client. Returns null if env vars are missing or placeholder.
 */
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

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (5 requests per minute per IP sliding window)
    const ip = getTrustedClientIp(req);

    const rateLimit = checkRateLimit(`leads_${ip}`, 5, 60_000);
    if (!rateLimit.success) {
      logSecurity('RateLimitExceeded', { ip, endpoint: '/api/leads' });
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a minute before trying again.' },
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
      logSecurity('ValidationError', { ip });
      return NextResponse.json(
        { error: 'Please check your submission details and ensure all fields are valid.' },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    // 3. Honeypot check: if hidden website field is filled, silently return success
    if (body.website) {
      logSecurity('HoneypotTriggered', { ip, field: 'website' });
      return NextResponse.json({ success: true });
    }

    // 4. Sanitize all inputs
    const fullName = sanitizeInput(body.fullName);
    const email = sanitizeInput(body.email);
    const company = sanitizeInput(body.company);
    const phone = body.phone ? sanitizeInput(body.phone) : '';

    // Verify session token
    const rawSessionToken = req.headers.get('x-session-token') || body.sessionToken || req.headers.get('x-session-id') || body.sessionId;
    const sessionCheck = verifySessionToken(rawSessionToken);
    const verifiedSessionId = sessionCheck.valid ? sessionCheck.sessionId : null;

    const cleanEmail = email.toLowerCase().trim();

    // Phone: optional, strict international validation
    let cleanPhone: string | null = null;
    if (phone) {
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number with country code (e.g., +91 or +1).' },
          { status: 400 }
        );
      }
      cleanPhone = phone.trim();
    }

    // Supabase Client Init
    const supabase = await getSupabaseClientSafe();

    if (!supabase) {
      logAnalytics('LeadCaptureServiceUnavailable', {
        companyLength: company.length,
        hasPhone: !!cleanPhone,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Lead registration service is currently offline or awaiting configuration. Please contact Raja Babu directly at raja@xaivon.com (+91-95211-90205) or book a discovery call at https://calendly.com/xaivon.',
          fallbackMailto: `mailto:raja@xaivon.com?subject=${encodeURIComponent(`Consultation Inquiry from ${fullName} (${company})`)}&body=${encodeURIComponent(`Name: ${fullName}\nCompany: ${company}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone || 'N/A'}\n`)}`
        },
        { status: 503 }
      );
    }

    // 5. Duplicate Lead Detection (Safe PostgREST query on clean email)
    try {
      const { data: existingLead } = await supabase
        .from('enterprise_leads')
        .select('id')
        .eq('email', cleanEmail)
        .limit(1);

      if (existingLead && existingLead.length > 0) {
        logAnalytics('DuplicateLeadPrevented', { maskedEmail: maskEmail(cleanEmail) });
        return NextResponse.json({
          success: true,
          note: "You're already in touch with our team. We will reach out to you shortly."
        });
      }
    } catch (dbError) {
      logSecurity('SupabaseError', { action: 'DuplicateCheck', error: String(dbError) });
    }

    // 6. Insert Lead (Matches schema)
    const insertPayload = {
      full_name: fullName,
      email: cleanEmail,
      company: company,
      phone: cleanPhone,
      session_id: verifiedSessionId || null,
      pipeline_stage: 'new',
    };

    const { data, error } = await supabase
      .from('enterprise_leads')
      .insert([insertPayload])
      .select('id');

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          note: 'Lead already registered for this session.'
        });
      }

      logSecurity('LeadInsertError', { code: error.code });
      return NextResponse.json(
        { error: 'Unable to save your details right now. Please email raja@xaivon.com directly.' },
        { status: 500 }
      );
    }

    logAnalytics('LeadSubmitted', {
      hasPhone: !!cleanPhone,
      companyLength: company.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      leadId: data?.[0]?.id,
      note: 'Inquiry successfully registered. We will be in touch shortly.'
    });

  } catch (error) {
    logSecurity('ServerError', { endpoint: '/api/leads', error: String(error) });
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please contact raja@xaivon.com directly.' },
      { status: 500 }
    );
  }
}