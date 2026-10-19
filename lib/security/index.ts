import { z } from 'zod';
import { after } from 'next/server';
import { CHAT_HISTORY_HARD_LIMIT } from '@/lib/config/chat';

// ==========================================
// RATE LIMITING (Sliding Window per instance)
// ==========================================
interface RateLimitRecord {
  timestamps: number[];
}

const MAX_RATE_LIMIT_STORE_ENTRIES = 5000;
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Periodically prunes expired rate limit entries to prevent memory growth.
 */
function pruneRateLimitStore(windowMs: number) {
  if (rateLimitStore.size <= MAX_RATE_LIMIT_STORE_ENTRIES) return;
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  pruneRateLimitStore(windowMs);

  const record = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { success: false, retryAfter };
  }

  record.timestamps.push(now);
  rateLimitStore.set(identifier, record);
  return { success: true };
}

/**
 * Extracts and sanitizes the client IP address from trusted platform headers.
 */
export function getTrustedClientIp(req: Request): string {
  // On Vercel, x-vercel-proxied-for or x-real-ip is set by the edge network
  const vercelIp = req.headers.get('x-vercel-ip') || req.headers.get('x-real-ip');
  if (vercelIp && vercelIp.trim()) {
    return vercelIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    if (candidate) return candidate;
  }

  return '127.0.0.1';
}

/**
 * Anonymizes an IP address for privacy-compliant audit telemetry.
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown';
  if (ip.includes('.')) {
    // IPv4: Zero last octet (e.g. 192.168.1.100 -> 192.168.1.0)
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    // IPv6: Keep first 3 groups
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  return 'anonymized';
}

// ==========================================
// INPUT SANITIZATION
// ==========================================
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, 2000); // Prevent oversized payloads
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : '***';
  return `${maskedUser}@${domain}`;
}

// ==========================================
// ZOD SCHEMAS (Unicode-Aware & Injection Safe)
// ==========================================
export const chatRequestSchema = z.object({
  messages: z.array(z.any()).max(CHAT_HISTORY_HARD_LIMIT),
  sessionId: z.string().max(100).optional(),
  sessionToken: z.string().max(120).optional(),
});

export const leadRequestSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name is too long")
    .regex(/^[\p{L}\p{M}\s\-\.']+$/u, "Invalid characters in name"),
  email: z.string().email("Invalid email format").max(100),
  company: z
    .string()
    .min(2, "Company must be at least 2 characters")
    .max(100, "Company name is too long")
    .regex(/^[\p{L}\p{M}\p{N}\s\-\.'&,]+$/u, "Invalid characters in company name"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid international phone format")
    .optional()
    .or(z.literal(''))
    .nullable(),
  sessionId: z.string().max(100).optional(),
  sessionToken: z.string().max(120).optional(),
  notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional().nullable(),
  website: z.string().max(100).optional(), // Honeypot
  messages: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  const countLetters = (str: string) => (str.match(/[\p{L}\p{M}]/gu) || []).length;
  if (countLetters(data.fullName) < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Name must have at least 2 letters", path: ["fullName"] });
  }
  if (countLetters(data.company) < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company must have at least 2 letters", path: ["company"] });
  }
});

// ==========================================
// SANITIZED ANALYTICS & LOGGING
// ==========================================
async function persistLog(
  action: string,
  severity: 'info' | 'warning' | 'error' | 'critical',
  details: Record<string, unknown>
) {
  after(async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // Do not attempt Supabase write if URL is missing or dummy
      if (!url || !serviceRoleKey || url.includes('dummy') || url.includes('your_supabase')) {
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, serviceRoleKey);

      const rawIp = typeof details.ip === 'string' ? details.ip : null;
      const anonIp = rawIp ? anonymizeIp(rawIp) : null;

      // Sanitize details: remove raw stack traces or tokens
      const cleanDetails = { ...details };
      delete cleanDetails.ip;
      delete cleanDetails.authorization;
      delete cleanDetails.cookie;

      await supabase.from('audit_logs').insert({
        action,
        severity: severity.toUpperCase(),
        details: cleanDetails,
        ip_address: anonIp,
        request_id: typeof details.requestId === 'string' ? details.requestId : null,
      });
    } catch {
      // Never crash the request runtime on audit log failures
    }
  });
}

export function logAnalytics(event: string, data: Record<string, unknown>) {
  // Redact PII from analytics before persisting
  const sanitizedData: Record<string, unknown> = { ...data };
  if (typeof sanitizedData.email === 'string') {
    sanitizedData.email = maskEmail(sanitizedData.email);
  }
  if (sanitizedData.phone) {
    sanitizedData.phone = '[REDACTED]';
  }
  if (sanitizedData.fullName) {
    sanitizedData.fullName = '[REDACTED]';
  }
  persistLog(event, 'info', sanitizedData);
}

export function logSecurity(event: string, details: Record<string, unknown>) {
  const sanitizedDetails: Record<string, unknown> = { ...details };
  if (typeof sanitizedDetails.email === 'string') {
    sanitizedDetails.email = maskEmail(sanitizedDetails.email);
  }
  if (sanitizedDetails.phone) {
    sanitizedDetails.phone = '[REDACTED]';
  }
  if (sanitizedDetails.fullName) {
    sanitizedDetails.fullName = '[REDACTED]';
  }
  console.warn(`[Security] [${event}]`, JSON.stringify(sanitizedDetails));
  persistLog(event, 'warning', sanitizedDetails);
}
