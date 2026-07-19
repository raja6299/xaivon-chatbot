import { z } from 'zod';
import { after } from 'next/server';

// ==========================================
// RATE LIMITING (Sliding Window)
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 2000); // Prevent oversized payloads
}

// ==========================================
// ZOD SCHEMAS
// ==========================================
export const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'data', 'tool', 'function']),
      content: z.union([
        z.string().max(10000),
        z.array(z.any()).max(20)
      ]).optional(),
      parts: z.array(z.any()).max(20).optional(),
      id: z.string().optional(),
    }).passthrough()
  ).max(100),
  sessionId: z.string().optional(),
});

export const leadRequestSchema = z.object({
  fullName: z.string().min(2).max(60).regex(/^[a-zA-Z\s\-']+$/, "Invalid characters in name"),
  email: z.string().email().max(100),
  company: z.string().min(2).max(100),
  phone: z.string().max(20).optional().nullable(),
  sessionId: z.string().optional(),
  website: z.string().optional(), // Honeypot
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
// ANALYTICS & LOGGING (Phase 14 Persistent Audit Logs)
// ==========================================
async function persistLog(action: string, severity: 'info' | 'warning' | 'error' | 'critical', details: Record<string, unknown>) {
  after(async () => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceRoleKey) return;
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, serviceRoleKey);
      
      await supabase.from('audit_logs').insert({
        action,
        severity,
        details,
        ip_address: typeof details.ip === 'string' ? details.ip : null,
        request_id: typeof details.requestId === 'string' ? details.requestId : null,
      });
    } catch (err) {
      console.error('Failed to persist audit log', err);
    }
  });
}

export function logAnalytics(event: string, data: Record<string, unknown>) {
  // Analytics event: removed verbose production logging
  persistLog(event, 'info', data);
}

export function logSecurity(event: string, details: Record<string, unknown>) {
  console.error(`[Security] [${event}]`, JSON.stringify(details));
  persistLog(event, 'warning', details);
}
