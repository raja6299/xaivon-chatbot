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
| `GROQ_API_KEY` | **Yes** | Groq Cloud API key for streaming LLM inference (`llama-3.3-70b-versatile`). |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical site base URL (defaults to `https://assistant.xaivon.com`). |
| `ALLOWED_FRAME_ANCESTORS` | Optional | Additional origins permitted to embed `/embed` via CSP `frame-ancestors`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase PostgreSQL project URL for lead and session storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase administrative service role key (server-side only). |

---

## 3. Local Development & Engineering Commands

```bash
# 1. Install dependencies
npm ci

# 2. Run local development server
npm run dev

# 3. Run automated test suite (RAG, Facts, Security, SSRF, Rate Limiting)
npm test

# 4. Run TypeScript typecheck
npx tsc --noEmit

# 5. Run ESLint code quality check
npm run lint

# 6. Build optimized production bundle
npm run build
```

---

## 4. Integration & Embedding

To embed the XAIVON Chatbot inside the marketing website or external platforms, see the dedicated specification:
- [`docs/integration/WEBSITE_EMBED_HANDOFF.md`](./docs/integration/WEBSITE_EMBED_HANDOFF.md)

---

## 5. Quality Assurance & Audit Documentation

For full architectural audit reports, root cause analyses, and test matrices:
- [`docs/qa/CHATBOT_BASELINE_AND_ROOT_CAUSES.md`](./docs/qa/CHATBOT_BASELINE_AND_ROOT_CAUSES.md)
- [`docs/qa/CHATBOT_ARCHITECTURE_AND_RISK_REGISTER.md`](./docs/qa/CHATBOT_ARCHITECTURE_AND_RISK_REGISTER.md)
- [`docs/qa/CHATBOT_SECURITY_PRIVACY_RBAC.md`](./docs/qa/CHATBOT_SECURITY_PRIVACY_RBAC.md)
- [`docs/qa/CHATBOT_FACTS_PRICING_AND_RAG.md`](./docs/qa/CHATBOT_FACTS_PRICING_AND_RAG.md)
- [`docs/qa/CHATBOT_UX_FUNCTIONAL_MATRIX.md`](./docs/qa/CHATBOT_UX_FUNCTIONAL_MATRIX.md)
- [`docs/qa/CHATBOT_CI_BUILD_AND_RELEASE_GATE.md`](./docs/qa/CHATBOT_CI_BUILD_AND_RELEASE_GATE.md)
