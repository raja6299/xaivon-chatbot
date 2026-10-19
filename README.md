# XAIVON AI Business Consultant — Chatbot Service

Production-grade conversational AI assistant and consultative discovery platform for **XAIVON** (`https://xaivon.com`).

- **Standalone Host:** `https://assistant.xaivon.com`
- **Embeddable Widget:** `https://assistant.xaivon.com/embed`
- **Parent Reference (READ-ONLY):** `https://xaivon.com`
- **Legal Entity:** ADABHRA GROUP | Founder & CEO: Raja Babu

---

## 1. System Architecture & Features

- **Next.js 16.2.10 (App Router, Turbopack)** with React 19 and `@ai-sdk/groq` (`llama-3.3-70b-versatile`).
- **Architectural Design System:**
  - **Light Mode:** Warm Architectural Ivory (`#F8F9FA`), Deep Slate (`#1A1D20`), and Burnished Copper (`#C4704B`).
  - **Dark Mode:** Deep Architectural Charcoal (`#0B0E14`), Soft Silver Ivory (`#E8ECEF`), and Luminous Warm Copper (`#D4805A`).
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
| `GROQ_CHAT_MODEL` | Optional | Primary chat LLM ID (defaults to `llama-3.3-70b-versatile`). |
| `GROQ_VISION_MODEL` | Optional | Vision model ID for document image attachments (disabled if unset). |
| `SESSION_SECRET` | Optional | Server-side secret for HMAC-SHA256 session tokens. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site base URL (defaults to `https://assistant.xaivon.com`). |
| `ALLOWED_FRAME_ANCESTORS` | Optional | Additional origins permitted to embed `/embed` via CSP `frame-ancestors`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase PostgreSQL project URL for lead and session storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase administrative service role key (server-side only). |

---

## 3. Verified Route Inventory (22 Routes)

All routes verified via Next.js App Router production build:

- **Public Applications:**
  - `/` — Standalone XAIVON AI Business Consultant
  - `/embed` — Isolated iframe embed with strict parent origin validation
  - `/login` — Admin login portal
- **Admin Management & Telemetry (RBAC protected):**
  - `/admin`, `/admin/analytics/ai`, `/admin/analytics/chat`, `/admin/analytics/rag`, `/admin/analytics/voice`, `/admin/calendar`, `/admin/crm`, `/admin/documents`, `/admin/health`, `/admin/integrations`, `/admin/knowledge`, `/admin/logs`, `/admin/pipeline`, `/admin/security`, `/admin/settings`
- **Hardened API Endpoints:**
  - `POST /api/chat` — Streaming AI conversation with HMAC session verification
  - `POST /api/leads` — Enterprise consultation capture with honest HTTP 503 fallback
  - `POST /api/parse-document` — 5MB bounded document ingestion with file signature checks
  - `POST /api/sessions` — Cryptographic HMAC-SHA256 session token issuance

---

## 4. Local Development & Engineering Commands

```bash
# 1. Install dependencies
npm ci

# 2. Run local development server
npm run dev

# 3. Run automated test suite (14 tests: RAG, Facts, Security, SSRF, Rate Limiting, HMAC)
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

## 6. Enterprise V2 Quality Assurance & Release Documentation

- [`docs/qa/CHATBOT_V2_FINDINGS_AND_FIXES.md`](./docs/qa/CHATBOT_V2_FINDINGS_AND_FIXES.md) — Defect classification and source remediations
- [`docs/qa/CHATBOT_V2_LIVE_PROVIDER_AND_API_MATRIX.md`](./docs/qa/CHATBOT_V2_LIVE_PROVIDER_AND_API_MATRIX.md) — Groq provider status, model deprecations, and API matrix
- [`docs/qa/CHATBOT_V2_SECURITY_PRIVACY.md`](./docs/qa/CHATBOT_V2_SECURITY_PRIVACY.md) — HMAC session security, SSRF defenses, PII anonymization, and DoS limits
- [`docs/qa/CHATBOT_V2_BRANDING_UI_QA.md`](./docs/qa/CHATBOT_V2_BRANDING_UI_QA.md) — Official geometric mark, copper palette, and responsive UI QA
- [`docs/qa/CHATBOT_V2_BUSINESS_FACTS_AND_SEO.md`](./docs/qa/CHATBOT_V2_BUSINESS_FACTS_AND_SEO.md) — Pricing reconciliation, truthful claims, and SEO directives
- [`docs/qa/CHATBOT_V2_FINAL_RELEASE_GATE.md`](./docs/qa/CHATBOT_V2_FINAL_RELEASE_GATE.md) — Final release decision, build verification, and rollback guide
