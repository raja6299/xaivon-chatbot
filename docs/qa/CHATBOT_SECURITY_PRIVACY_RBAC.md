# XAIVON Chatbot — Security, Privacy & Access Control Specification

**Repository:** `raja6299/xaivon-chatbot`
**Standard:** Enterprise Security & Data Isolation
**Date:** October 19, 2026

---

## 1. Threat Modeling & Mitigation Summary

The XAIVON Chatbot operates in a public-facing web environment where arbitrary untrusted users can submit text prompts, document attachments, and lead requests. The backend architecture enforces strict defense-in-depth principles:

```
[Untrusted Visitor Input]
        │
        ▼
[1. Next.js Route Guard & Rate Limiter] (proxy.ts, lib/security)
        │
        ▼
[2. Zod Strict Schema & Unicode Sanitation] (leadRequestSchema, chatRequestSchema)
        │
        ▼
[3. Zero Autonomous Tools Policy] (No direct model execution of webhooks/APIs)
        │
        ▼
[4. RAG Boundary Isolation] (In-memory facts, Read-Only, No DB writes)
        │
        ▼
[5. Egress Protection & SSRF Filter] (lib/integrations/engine.ts)
```

---

## 2. Server-Side Request Forgery (SSRF) Defenses

### 2.1 Vulnerability Discovered in Baseline
Previously, `lib/integrations/engine.ts` used a naive three-host denylist (`localhost`, `127.0.0.1`, `metadata.google.internal`). This was trivially bypassed by:
- Decimal/Hex IP encodings (e.g., `2130706433` for `127.0.0.1`).
- AWS/GCP cloud instance metadata IP: `169.254.169.254`.
- RFC1918 internal subnets: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
- IPv6 loopback (`::1`) and unique local addresses (`fc00::/7`).
- HTTP redirects (`301`/`302`) to internal services.

### 2.2 Hardened Implementation (`lib/integrations/engine.ts`)
1. **Strict Destination Allowlisting:** All outbound webhooks must originate from approved vendor domains (`hooks.zapier.com`, `api.hubspot.com`, `slack.com`, `discord.com`).
2. **IP Space Filtering:** Validates every IP address against private, carrier-grade NAT, multicast, and link-local ranges:
   ```typescript
   if (
     (first === 10) ||
     (first === 127) ||
     (first === 169 && second === 254) ||
     (first === 172 && second >= 16 && second <= 31) ||
     (first === 192 && second === 168)
   ) {
     return true; // REJECT
   }
   ```
3. **Protocol & Redirect Enforcement:** Requires HTTPS (`https:`) and disables automated redirects (`redirect: 'manual'`) to block redirection bypasses.
4. **Automated Verification:** Verified in `tests/security.test.mjs` against 15 hostile hostnames and private IP ranges.

---

## 3. Tool Execution & Side-Effect Removal

### 3.1 Policy
**LLM decisions are NEVER treated as authorization.** An untrusted user can perform prompt injection to manipulate model tool calls.
- **Removed from Public Chat:** Autonomous invocation of `triggerZapierWebhook`, `sendSlackNotification`, and `syncHubSpotCRM` has been permanently disabled in `app/api/chat/route.ts`.
- **Consent-First Architecture:** Any CRM sync or meeting creation must be initiated by an explicit user action via dedicated UI forms (`LeadFormModal`, `CalendarModal`).

---

## 4. Administrative RBAC & Auth Bypass Prevention

### 4.1 Route Guard (`proxy.ts`)
In Next.js 16.2.10, `proxy.ts` guards all incoming requests:
```typescript
if (request.nextUrl.pathname.startsWith('/admin')) {
  // 1. If Supabase is unconfigured, DENY ALL access (fail-secure)
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('dummy')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  // 2. Inspect Supabase authentication session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}
```
- **Fail-Secure Default:** Missing environment variables cause immediate redirection to `/admin/login`. Anonymous users can never view admin records or metrics.

---

## 5. Privacy, PII Protection & Telemetry Sanitation

### 5.1 Redaction in Logs
Raw visitor chat payloads, prompts, full emails, and phone numbers are strictly prohibited from log storage:
- **Email Masking:** `maskEmail('raja@xaivon.com')` -> `r***a@xaivon.com`.
- **Phone Redaction:** Replaced with `[REDACTED]`.
- **Error Propagation:** Upstream LLM provider exceptions (such as API key errors) are caught server-side and never forwarded to client responses.

---

## 6. Input Validation & Internationalization (Unicode Support)

### 6.1 Unicode Name & Company Sanitization
To support Indian and international clients without compromising security:
- **Regex:** `/^[\p{L}\p{M}\s\-\.']+$/u`
  - `\p{L}`: Unicode Letters (English, Devanagari, Latin, Cyrillic, etc.).
  - `\p{M}`: Combining marks (essential for Devanagari matras, accents, and umlauts).
- **Reject Hostile Input:** Single-character entries (`A`), pure digits, HTML tags (`<script>`), and SQL operators are rejected.
- **Deduplication:** Lead submission checks email within a 24-hour sliding window to prevent accidental double-submits.

---

## 7. Rate Limiting

- **Chat API:** 20 requests per minute per IP address. Returns `429 Too Many Requests` with a calculated `Retry-After` header.
- **Leads API:** 5 submissions per 10 minutes per IP address.
- **Sessions API:** 30 requests per minute per IP address.
