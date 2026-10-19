# XAIVON CHATBOT V2 — SECURITY, PRIVACY & DATA INTEGRITY SPECIFICATION

**Document Date:** October 20, 2026  
**Repository:** `raja6299/xaivon-chatbot`  
**Host:** `assistant.xaivon.com`  
**Standard:** OWASP Top 10 API Security / Privacy by Design  

---

## 1. PII Redaction & Data Minimization

In compliance with international data privacy best practices and DPDP/GDPR alignment:

### 1.1 IP Address Anonymization (`lib/security/index.ts`)
- Client IP addresses are never stored in raw form in persistent telemetry or audit tables.
- Function `anonymizeIp(ip: string)` zeroes the final host octet for IPv4 (e.g., `103.21.244.15` -> `103.21.244.0`) and truncates device identifiers for IPv6 (e.g., `2001:0db8:85a3::`).
- Platform-trusted headers (`x-vercel-ip`, `x-real-ip`) are extracted via `getTrustedClientIp()` to prevent IP header spoofing.

### 1.2 Contact Data Masking
- Function `maskEmail(email: string)` obscures visitor email usernames in audit traces (e.g., `raja@xaivon.com` -> `r***a@xaivon.com`).
- Visitor phone numbers, message texts, and company names are omitted from standard error telemetry.

### 1.3 Redacted Error Traces
- All API route handlers (`/api/chat`, `/api/leads`, `/api/parse-document`) catch exceptions and log sanitized categorizations rather than raw stack traces or payload bodies.

---

## 2. Session Integrity & Cross-Session IDOR Prevention

### 2.1 Threat Model
In legacy code, clients could submit arbitrary `x-session-id` strings. Because the backend utilized Supabase service-role credentials to persist messages, a malicious actor could write fabricated conversations into foreign visitor sessions, potentially corrupting lead qualification histories.

### 2.2 HMAC-SHA256 Cryptographic Binding (`lib/security/session.ts`)
- **Generation:** On `POST /api/sessions`, the server issues:
  - `sessionId`: A cryptographically random UUID v4.
  - `sessionToken`: `<sessionId>.<16-char-hmac>` generated using HMAC-SHA256 and server secret `SESSION_SECRET`.
- **Verification:** On `POST /api/chat` and `POST /api/leads`, `verifySessionToken()` parses the token, recalculates the HMAC, and compares hashes using `crypto.timingSafeEqual` to prevent timing attacks.
- **Enforcement:** If a client submits a sessionId without a matching valid HMAC token, database persistence is bypassed completely.

---

## 3. Server-Side Request Forgery (SSRF) Hardening

### 3.1 Autonomous Tool Execution Disabled
Model tool calling to external services has been permanently removed from `POST /api/chat`. The LLM cannot autonomously generate URLs or dispatch webhooks.

### 3.2 Outbound Webhook Allowlisting (`lib/integrations/engine.ts`)
For explicit server-side alerts, destinations must pass `validateWebhookDestination()`:
1. **Protocol:** Strictly HTTPS (`https:`).
2. **Host Allowlist:** Only approved provider domains (`hooks.slack.com`, `hooks.zapier.com`, `api.hubspot.com`, `xaivon.com`).
3. **Private IP Rejection:** Blocks `localhost`, `127.0.0.1`, RFC1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local / cloud metadata IP (`169.254.169.254`), and IPv6 private addresses (`::1`, `fe80::`).

---

## 4. Input & File Parsing Boundaries (DoS Mitigation)

### 4.1 Document Parsing Limits (`app/api/parse-document/route.ts`)
- **Pre-buffering Size Gate:** `Content-Length` header check and `file.size` inspection enforce a strict **5 MB limit** before `file.arrayBuffer()` is loaded into memory.
- **Magic Bytes Validation:**
  - PDF: Verified `%PDF-` signature (`0x25 0x50 0x44 0x46`).
  - Office (DOCX / XLSX): Verified `PK\x03\x04` signature (`0x50 0x4B 0x03 0x04`).
  - Text / CSV: Verified UTF-8 stream without null byte corruption in the initial 512-byte header.
- **Decompression / Billion-Row Bomb Protection:** In Excel parsing, `xlsx.read` enforces `sheetRows: 250` to cap processing memory.
- **Output Truncation:** Extracted text is capped at 50,000 characters to prevent context window exhaustion.

---

## 5. Rate Limiting & Resource Exhaustion Defense

### 5.1 Sliding Window Memory Bounding
- In-memory rate limiting stores active sliding-window timestamps per client identifier.
- Store size is strictly capped at **5,000 entries**. Automatic pruning deletes expired records on every check, preventing memory leakage on long-lived serverless instances.

### 5.2 Endpoint Thresholds
| Endpoint | Window | Max Requests | Rate-Limit Action |
| :--- | :--- | :--- | :--- |
| `POST /api/chat` | 60 seconds | 20 requests | HTTP 429 with `Retry-After` |
| `POST /api/leads` | 60 seconds | 5 requests | HTTP 429 with `Retry-After` |
| `POST /api/parse-document` | 60 seconds | 5 requests | HTTP 429 with `Retry-After` |
| `POST /api/sessions` | 60 seconds | 30 requests | HTTP 429 with `Retry-After` |

---

## 6. Embed Isolation & PostMessage Verification

### 6.1 Strict Parent Origin Allowlist (`app/embed/page.tsx`)
Inbound postMessage events (`XAIVON_THEME_CHANGE`, `XAIVON_OPEN_WITH_PROMPT`) enforce:
1. `event.origin` must strictly match an approved origin (`https://xaivon.com`, `https://www.xaivon.com`, or local development ports).
2. `event.source === window.parent` to guarantee messages originate from the embedding frame.
3. Outbound events (`XAIVON_CHAT_READY`, `XAIVON_CHAT_CLOSE`) are dispatched exclusively to verified parent origins.
