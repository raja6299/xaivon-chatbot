import { z } from 'zod';

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
  messages: z.array(z.any()).max(50),
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
// ANALYTICS & LOGGING
// ==========================================
export function logAnalytics(event: string, data: Record<string, unknown>) {
  // Fire and forget, no blocking
  setImmediate(() => {
    console.log(`[Analytics] [${event}]`, JSON.stringify(data));
  });
}

export function logSecurity(event: string, details: Record<string, unknown>) {
  setImmediate(() => {
    console.error(`[Security] [${event}]`, JSON.stringify(details));
  });
}
