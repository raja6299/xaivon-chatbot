# XAIVON CHATBOT V2 — LIVE PROVIDER, MODEL & API TEST MATRIX

**Document Date:** October 20, 2026  
**Repository:** `raja6299/xaivon-chatbot`  
**Host:** `assistant.xaivon.com`  
**Status:** `HOLD FOR OWNER REVIEW` (Upstream Provider Credential Required)

---

## 1. Upstream AI Provider Status & Model Analysis

### 1.1 Provider Authentication Audit
- **Provider:** Groq Cloud (`api.groq.com/openai/v1`)
- **Observed Upstream Status:** HTTP 401 `invalid_api_key`
- **Root Cause:** The staging test key in local environment is invalid or expired.
- **Strict Evidence Policy:** In adherence to Phase 1 directives, test results are NOT fabricated, and mock responses are NOT claimed as live AI inference.
- **Required Owner Remediation:**
  1. Access [Groq Console](https://console.groq.com/keys).
  2. Create an active API key with developer or paid tier privileges.
  3. Add the key as `GROQ_API_KEY` in Vercel project environment settings (Production and Preview scopes).
  4. Trigger a production redeploy.

### 1.2 Model Deprecation & Compatibility Audit
In accordance with official Groq deprecation schedules (`console.groq.com/docs/deprecations`):

| Model ID | Historical Role | Official Status | V2 Remediation & Compatibility |
| :--- | :--- | :--- | :--- |
| `llama-3.3-70b-versatile` | Text & Chat | Restricted on free/dev tiers (2026-08-16) | Configurable via `GROQ_CHAT_MODEL`. Default fallback maintained. Compatible with `ai@7` & `@ai-sdk/groq@4`. |
| `llama-3.2-11b-vision-preview` | Multimodal Vision | **Decommissioned (2025-04-14)** | **Disabled in V2 baseline.** Replaced with runtime safety gate: images rejected with friendly notice unless `GROQ_VISION_MODEL` is explicitly configured. |
| `openai/gpt-oss-20b` | Economic Text Candidate | Available on supported tiers | Supported via `GROQ_CHAT_MODEL=openai/gpt-oss-20b`. |

---

## 2. API Route Verification Matrix

All 4 active Next.js App Router API endpoints in `app/api/*` were audited, hardened, and verified:

```
app/
└── api/
    ├── chat/
    │   └── route.ts         [POST] Streaming AI conversation & session binding
    ├── leads/
    │   └── route.ts         [POST] Enterprise consultation capture & honest 503 fallback
    ├── parse-document/
    │   └── route.ts         [POST] Hardened 5MB document ingestion with magic bytes
    └── sessions/
        └── route.ts         [POST] Cryptographic HMAC-SHA256 session token generation
```

### 2.1 `POST /api/chat`
- **Method:** `POST`
- **Request Body:** `{ messages: UIMessage[], sessionId?: string, sessionToken?: string }`
- **Transport:** AI SDK 7 `DefaultChatTransport` with `toUIMessageStreamResponse()`
- **Verified Behaviors:**
  - Rejects oversized message histories (`CHAT_HISTORY_HARD_LIMIT` = 20) with HTTP 400.
  - Verifies HMAC session token using `verifySessionToken`. If token is absent or invalid, skips Supabase persistence to prevent IDOR / cross-session injection.
  - Injects verified business facts from `RAGManager` (retrieval limited to top 3 snippets, deterministic scoring).
  - Enforces scope-based pricing policy (never fabricates dollar amounts).
  - Handles upstream Groq HTTP 401 with HTTP 500 containing clear, un-fabricated founder contact guidance.

### 2.2 `POST /api/leads`
- **Method:** `POST`
- **Request Body:** `{ fullName: string, email: string, company: string, phone?: string, notes?: string, website?: string }`
- **Verified Behaviors:**
  - **Critical Issue 05 Remediation:** If Supabase is unconfigured or returns a connection failure, the route returns HTTP 503:
    ```json
    {
      "success": false,
      "message": "Lead storage service is temporarily unavailable. Please contact Raja Babu directly.",
      "fallbackMailto": "mailto:raja@xaivon.com?subject=Enterprise%20Inquiry..."
    }
    ```
  - **No Fake Success:** Zero leads are falsely acknowledged without confirmed delivery.
  - **Input Preservation:** The frontend modal preserves all form inputs on error and displays a direct 1-click mailto fallback.
  - **Schema Validation:** Strict Unicode support for Devanagari and international names; international E.164 phone regex (`^\+?[1-9]\d{6,14}$`).
  - **Honeypot:** Hidden `website` field triggers silent 200 to neutralize automated bot spam.
  - **Rate Limiting:** Sliding window limits per trusted client IP.

### 2.3 `POST /api/parse-document`
- **Method:** `POST` (multipart/form-data)
- **Verified Behaviors:**
  - **Rate Limiting:** Max 5 uploads per minute per trusted client IP (HTTP 429).
  - **Size Guard:** Rejects payloads > 5MB before buffering (HTTP 413).
  - **Format Allowlist:** `.pdf`, `.docx`, `.xlsx`, `.xls`, `.csv`, `.txt`.
  - **Magic Bytes:** Validates file signatures (`%PDF-`, `PK\x03\x04`, text sample without null bytes).
  - **Excel Row Protection:** Caps `sheetRows: 250` in `xlsx.read` to prevent memory exhaustion from zip bombs or million-row sheets.
  - **Output Limit:** Extracted text truncated to 50,000 characters.

### 2.4 `POST /api/sessions`
- **Method:** `POST`
- **Response:** `{ sessionId: string, sessionToken: string }`
- **Verified Behaviors:**
  - Generates UUID v4 session ID.
  - Signs session ID with HMAC-SHA256 producing format `<sessionId>.<16-char-hmac>`.
  - Rate limited to 30 session generations per minute per client IP.

---

## 3. Operational Release Gate Status

| Gate Requirement | Evidence / Observation | Result |
| :--- | :--- | :--- |
| **Valid Groq Key** | Upstream returned 401 on staging key | **BLOCKED (Requires Owner Provisioning)** |
| **Safe Model IDs** | Decommissioned models safely decoupled | **PASS** |
| **Streaming UI Error Handling** | Honest outage message with direct contact | **PASS** |
| **Lead Integrity (No Fake 200)** | Verified HTTP 503 + pre-filled mailto | **PASS** |
| **Session Security (No IDOR)** | HMAC-SHA256 signed tokens verified | **PASS** |
| **Document Parse Boundaries** | 5MB pre-buffer check + magic bytes | **PASS** |
| **Admin Route Security** | Fails closed on unconfigured database | **PASS** |

**Recommendation:** Hold deployment to production until owner inputs the valid `GROQ_API_KEY` in Vercel settings.
