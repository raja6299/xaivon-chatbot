import { z } from 'zod';
import { after } from 'next/server';
import { CHAT_HISTORY_HARD_LIMIT } from '@/lib/config/chat';

// ==========================================
// RATE LIMITING (Sliding Window per instance)
// ==========================================
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
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
  phone: z.string().max(25).optional().nullable(),
  sessionId: z.string().max(100).optional(),
  website: z.string().max(100).optional(), // Honeypot
  messages: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  const countLetters = (str: string) => (str.match(/\p{L}/gu) || []).length;
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

      await supabase.from('audit_logs').insert({
        action,
        severity: severity.toUpperCase(),
        details,
        ip_address: typeof details.ip === 'string' ? details.ip : null,
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
