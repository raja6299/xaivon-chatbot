# Final V3 Security Specification: Session Cryptography, Rate Limiting & Input Defense

**Document Identifier:** `XAIVON-QA-SECURITY-V3-20261019`  
**Target Repository:** `raja6299/xaivon-chatbot`  
**Date:** October 19, 2026  
**Status:** FACT-VERIFIED & IMPLEMENTED  

---

## 1. Session Cryptography & Token Life Cycle

### 1.1 Secret Enforcement & Production Fail-Closed Policy
In `lib/security/session.ts`, the secret derivation logic enforces strict entropy:
```typescript
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error(
        '[Security Exception] Fatal: SESSION_SECRET must be configured with at least 32 characters in production environments.'
      );
    }
    return secret;
  }
  
  return secret || process.env.SUPABASE_SERVICE_ROLE_KEY || 'xaivon_dev_session_hmac_secret_2026_test_only';
}
```
- **Development/Test:** Permits a development-only key to allow unit testing without mock injection.
- **Production:** Fails immediately with a runtime exception if `SESSION_SECRET` is missing or has less than 32 characters (256 bits of entropy).
- **Service Role Isolation:** Service role keys are prohibited from acting as the default session signing key in production.

### 1.2 Enhanced Token Format with Timestamp Expiry
Tokens are minted with explicit timestamp expiry and full 64-character (256-bit) HMAC-SHA256 signatures:
```text
Token Format: <sessionId>.<expiryTimestamp>.<hmacSha256Hex>
```
1. **Creation:** `createSessionToken(sessionId, ttlMs = 7 * 24 * 60 * 60 * 1000)` calculates `expiry = Date.now() + ttlMs`, computes HMAC-SHA256 over `${sessionId}:${expiry}`, and formats the token string.
2. **Verification:** `verifySessionToken(token)`:
   - Validates format.
   - Compares HMAC using `crypto.timingSafeEqual` to prevent timing attacks.
   - Validates that `Date.now() <= expiry`. If expired, returns `{ valid: false, reason: 'expired' }`.
   - Rejection on any signature mismatch or payload tampering.

---

## 2. Distributed Rate Limiting & Identity Protection

### 2.1 Trusted Client IP Resolution (`getTrustedClientIp`)
Attackers often spoof the `X-Forwarded-For` header by prepending arbitrary IP addresses. The chatbot applies an authoritative header priority ladder:

```typescript
export function getTrustedClientIp(req: Request): string {
  // 1. Authoritative Vercel edge header (injected by Vercel infrastructure, cannot be spoofed by client)
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // 2. Cloudflare edge header (if fronted by Cloudflare proxy)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }

  // 3. Standard X-Forwarded-For: take the rightmost or leftmost based on reverse proxy count
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim());
    return parts[0] || '127.0.0.1';
  }

  return '127.0.0.1';
}
```

### 2.2 Rate Limit Windows and Memory Pruning
`lib/security/index.ts` enforces granular per-endpoint rate limits:
- **Chat Completions:** 20 requests per minute per IP.
- **Session Minting:** 10 sessions per minute per IP.
- **Lead Submissions:** 5 leads per minute per IP.
- **Document Parsing:** 5 uploads per minute per IP.
- **Admin Authentication:** 5 attempts per 15 minutes.

**Instance Pruning & Leak Prevention:**
When the tracking table exceeds 5,000 entries, an automated sweep removes all expired entries. If memory utilization spikes under DDoS, the limiter fails closed with HTTP 429 and a descriptive `Retry-After: 60` response header.

---

## 3. Upload & Document Parsing Defenses

In `app/api/parse-document/route.ts`:

### 3.1 Upfront Content-Length Enforcement
```typescript
const contentLength = req.headers.get('content-length');
if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
  return NextResponse.json(
    { error: 'File size exceeds maximum permitted limit (5MB).' },
    { status: 413 }
  );
}
```
This halts unbounded multipart streaming before buffers are allocated in serverless memory.

### 3.2 Magic Byte File Signature Verification
Rather than relying on client-supplied MIME types:
- **PDF:** Must begin with `%PDF` (`[0x25, 0x50, 0x44, 0x46]`). Executables disguised as PDFs (`MZ\x90`) are rejected immediately.
- **DOCX / XLSX:** Must begin with standard PKZIP magic bytes (`[0x50, 0x4b, 0x03, 0x04]`).

### 3.3 Safe PDF Parser Runtime Isolation
Using class-based `PDFParse` with explicit cleanup:
```typescript
const { PDFParse } = require('pdf-parse');
const parser = new PDFParse({ data: buffer });
const data = await parser.getText();
if (typeof parser.destroy === 'function') {
  await parser.destroy();
}
```
Output text is truncated at 12,000 characters to prevent prompt-injection amplification or context-window saturation.

---

## 4. Supabase Database Integrity & RLS Verification

### 4.1 Transparent PostgREST Error Handling
In all database write operations (`chat_sessions`, `chat_messages`, `leads`):
- Operations explicitly capture `{ data, error }`.
- If an error occurs (such as table absence or RLS policy violation), the error code is logged with sensitive parameters redacted, and the API returns an honest status:
  - For `api/sessions`: Returns `{ sessionId, sessionToken, persisted: false }`.
  - For `api/leads`: If duplicate lead (`code: '23505'`), returns idempotent success without leaking other leads' PII. If insertion fails, returns HTTP 500 with fallback direct contact instructions.

---

## 5. HTTP Security Headers & Content Security Policy (CSP)

Configured in `next.config.ts`:
```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self' https://xaivon.com https://www.xaivon.com;",
  },
];
```
- **Clickjacking Protection:** Disallows embedding by arbitrary third-party domains while permitting `https://xaivon.com` and `https://www.xaivon.com`.
- **Microphone Permissions:** Scoped strictly to `'self'` for voice recognition features.
- **XSS Mitigation:** `X-Content-Type-Options: nosniff` prevents MIME-type confusion attacks.
