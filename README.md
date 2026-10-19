# XAIVON AI Business Consultant — Chatbot Service

Production-grade conversational AI assistant and consultative discovery platform for **XAIVON** (`https://xaivon.com`).

- **Standalone Host:** `https://assistant.xaivon.com`
- **Embeddable Widget:** `https://assistant.xaivon.com/embed`
- **Parent Reference (READ-ONLY):** `https://xaivon.com`
- **Legal Entity:** ADABHRA GROUP | Founder & CEO: Raja Babu

---

## 1. System Architecture & Features

- **Next.js 16.2.10 (App Router, Turbopack)** with React 19 and `@ai-sdk/groq` (`openai/gpt-oss-120b` primary, `openai/gpt-oss-20b` fallback).
- **Architectural Design System:**
  - **Light Mode:** Warm Architectural Ivory (`#FAF8F5`), Deep Slate (`#1A1D20`), and Burnished Copper (`#B35734`).
  - **Dark Mode:** Deep Architectural Charcoal (`#121110`), Card Surface (`#1A1816`), and Official Warm Copper (`#B35734`).
- **Security & Privacy:**
  - Zero autonomous side-effect tools exposed to public LLM streams.
  - Strict SSRF defenses with comprehensive RFC1918, link-local, and AWS/GCP cloud metadata IP filtering (`169.254.169.254`).
  - Fail-secure administrative route protection in `proxy.ts`.
  - PII redaction and email masking in audit telemetry (`r***a@xaivon.com`).
  - Internationalized Unicode name & company validation supporting Indic matras (`/^[\p{L}\p{M}\s\-\.']+$/u`).
- **Deterministic RAG Knowledge Engine:**
  - Versioned single source of truth in `lib/knowledge/XAIVON_APPROVED_FACTS.ts`.
  - In-memory token & keyword matching with **zero database writes** during chat execution.

---

## 2. Environment Variables Configuration

Set these variable **names** in your deployment platform (Vercel) or local `.env.local`.
*(Never commit actual API keys or secret values into version control.)*

| Variable Name | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | **Yes** | Groq Cloud API key for streaming LLM inference. |
| `GROQ_CHAT_MODEL` | Optional | Primary chat LLM ID (defaults to `openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b`). |
| `GROQ_VISION_MODEL` | Optional | Vision model ID for document image attachments (disabled if unset). |
| `SESSION_SECRET` | Required in Prod | Server-side secret (min 32 chars) for HMAC-SHA256 session tokens. Fails closed in production if missing. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site base URL (defaults to `https://assistant.xaivon.com`). |
| `ALLOWED_FRAME_ANCESTORS` | Optional | Additional origins permitted to embed `/embed` via CSP `frame-ancestors`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase PostgreSQL project URL for lead and session storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase administrative service role key (server-side only). |

---

## 3. Verified Route Inventory (28 Routes)

All routes verified via Next.js App Router production build:

- **Public Applications:**
  - `/` — Standalone XAIVON AI Business Consultant
  - `/embed` — Isolated iframe embed with strict parent origin validation
  - `/icon` — Dynamic 32x32 SVG brand mark generator
  - `/login` — Admin login portal
  - `/robots.txt` & `/sitemap.xml` — Search engine indexing controls
- **Admin Management & Telemetry (RBAC protected):**
  - `/admin`, `/admin/analytics/ai`, `/admin/analytics/chat`, `/admin/analytics/rag`, `/admin/analytics/voice`, `/admin/calendar`, `/admin/crm`, `/admin/documents`, `/admin/health`, `/admin/integrations`, `/admin/knowledge`, `/admin/logs`, `/admin/pipeline`, `/admin/security`, `/admin/settings`
- **Hardened API Endpoints:**
  - `POST /api/chat` — Streaming AI conversation with HMAC session verification & honest provider error reporting
  - `POST /api/leads` — Enterprise consultation capture with honest HTTP 503 fallback
  - `POST /api/parse-document` — 5MB bounded document ingestion with file signature checks & class-based `PDFParse` runtime
  - `POST /api/sessions` — Cryptographic HMAC-SHA256 session token issuance with timestamp expiry

---

## 4. Local Development & Engineering Commands

```bash
# 1. Install dependencies
npm ci

# 2. Run local development server
npm run dev

# 3. Run automated test suite (26 tests: API Handlers, RAG, Facts, Security, SSRF, Rate Limiting, HMAC, PDFParse)
npm test

# 4. Run TypeScript typecheck
npx tsc --noEmit

# 5. Run ESLint code quality check
npm run lint

# 6. Build optimized production bundle
npm run build
```

---

## 5. Integration & Embedding

To embed the XAIVON Chatbot inside the marketing website or external platforms, see the dedicated specification:
- [`docs/integration/WEBSITE_EMBED_HANDOFF.md`](./docs/integration/WEBSITE_EMBED_HANDOFF.md)

---

## 6. Enterprise V3 Quality Assurance & Release Documentation

- [`docs/qa/FINAL_PROVIDER_DECISION_AND_FREE_LIMITS.md`](./docs/qa/FINAL_PROVIDER_DECISION_AND_FREE_LIMITS.md) — Groq model verification & token limits
- [`docs/qa/FINAL_V3_FINDINGS_FIXES_AND_RISKS.md`](./docs/qa/FINAL_V3_FINDINGS_FIXES_AND_RISKS.md) — Root causes, fixes & risk register
- [`docs/qa/FINAL_V3_SECURITY_SESSION_RATE_LIMIT.md`](./docs/qa/FINAL_V3_SECURITY_SESSION_RATE_LIMIT.md) — Session crypto & rate limiting
- [`docs/qa/FINAL_V3_BRANDING_PARITY_AND_UI.md`](./docs/qa/FINAL_V3_BRANDING_PARITY_AND_UI.md) — Exact official brand geometry & responsive UI
- [`docs/qa/FINAL_V3_BUSINESS_PRICING_AND_METADATA.md`](./docs/qa/FINAL_V3_BUSINESS_PRICING_AND_METADATA.md) — 6 category starting pricing parity
- [`docs/qa/FINAL_V3_REAL_INFERENCE_AND_TEST_MATRIX.md`](./docs/qa/FINAL_V3_REAL_INFERENCE_AND_TEST_MATRIX.md) — Live inference probe & test results
- [`docs/qa/FINAL_V3_RELEASE_GO_NO_GO.md`](./docs/qa/FINAL_V3_RELEASE_GO_NO_GO.md) — Release scorecard & HOLD decision
