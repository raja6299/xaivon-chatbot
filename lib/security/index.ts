import { z } from 'zod';
import { after } from 'next/server';
import { CHAT_HISTORY_HARD_LIMIT } from '@/lib/config/chat';

// ==========================================
// RATE LIMITING (Sliding Window per instance + Distributed Ready)
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
): { success: boolean; retryAfter?: number; storeType: 'in-memory' | 'distributed' } {
  const now = Date.now();
  pruneRateLimitStore(windowMs);

  const record = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { success: false, retryAfter, storeType: 'in-memory' };
  }

  record.timestamps.push(now);
  rateLimitStore.set(identifier, record);
  return { success: true, storeType: 'in-memory' };
}

/**
 * Extracts and sanitizes the client IP address from trusted edge platform headers.
 * Precedence: Vercel authoritative edge headers > Cloudflare > standard proxy headers.
 */
export function getTrustedClientIp(req: Request): string {
  // 1. Authoritative Vercel edge headers (injected by Vercel edge router, non-spoofable by client)
  const vercelForwarded = req.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded && vercelForwarded.trim()) {
    const candidate = vercelForwarded.split(',')[0].trim();
    if (candidate) return candidate;
  }

  const vercelIp = req.headers.get('x-vercel-ip') || req.headers.get('x-real-ip');
  if (vercelIp && vercelIp.trim()) {
    return vercelIp.trim();
  }

  // 2. Cloudflare edge header (when fronted by Cloudflare proxy)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // 3. Fallback to standard x-forwarded-for with client header sanitization
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded && forwarded.trim()) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[0];
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
// INPUT SANITIZATION & REDACTION
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

const SENSITIVE_KEY_PATTERN = /password|secret|token|authorization|cookie|key|api_key|credit|cvv/i;

/**
 * Recursively redacts sensitive credentials, tokens, PII, and oversized strings from logs.
 */
export function sanitizeLogData(obj: unknown, depth = 0): unknown {
  if (depth > 4) return '[MAX_DEPTH]';
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      if (obj.includes('@') && obj.includes('.')) return maskEmail(obj);
      if (obj.length > 300) return `${obj.slice(0, 300)}...[TRUNCATED]`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => sanitizeLogData(item, depth + 1));
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (key === 'email' && typeof value === 'string') {
      clean[key] = maskEmail(value);
    } else if (key === 'phone' || key === 'fullName') {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = sanitizeLogData(value, depth + 1);
    }
  }
  return clean;
}

// ==========================================
// ZOD SCHEMAS (Unicode-Aware & Injection Safe)
// ==========================================
export const chatMessagePartSchema = z.object({
  type: z.string().max(50),
  text: z.string().max(4000).optional(),
}).passthrough();

export const chatMessageSchema = z.object({
  id: z.string().max(100).optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(4000).optional(),
  parts: z.array(chatMessagePartSchema).max(20).optional(),
}).passthrough();

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(CHAT_HISTORY_HARD_LIMIT),
  sessionId: z.string().max(100).optional(),
  sessionToken: z.string().max(180).optional(),
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
  sessionToken: z.string().max(180).optional(),
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
  try {
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

        // Recursively sanitize all payload fields
        const cleanDetails = sanitizeLogData(details) as Record<string, unknown>;
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
  } catch {
    // Graceful fallback when invoked outside of active Next.js request lifecycle
  }
}

export function logAnalytics(event: string, data: Record<string, unknown>) {
  const sanitized = sanitizeLogData(data) as Record<string, unknown>;
  persistLog(event, 'info', sanitized);
}

export function logSecurity(event: string, details: Record<string, unknown>) {
  const sanitized = sanitizeLogData(details) as Record<string, unknown>;
  console.warn(`[Security] [${event}]`, JSON.stringify(sanitized));
  persistLog(event, 'warning', sanitized);
}
