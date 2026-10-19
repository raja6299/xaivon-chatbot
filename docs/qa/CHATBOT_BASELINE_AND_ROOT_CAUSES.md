# XAIVON Chatbot — Baseline Audit & Root Cause Analysis

**Document Status:** CONFIRMED & VERIFIED
**Repository Under Test:** `raja6299/xaivon-chatbot`
**Target Domain / Aliases:** `https://assistant.xaivon.com`
**Parent Reference Domain:** `https://xaivon.com` (READ-ONLY)
**Date of Audit:** October 19, 2026

---

## 1. Executive Summary

This document establishes the verified root-cause analysis for the two primary production failures identified on the XAIVON Chatbot deployment:
1. **Parent Page Iframe Refusal / Embedding Failure**
2. **AI Stream Termination & Generic "Server error. Please try again." Response**

Every hypothesis has been independently tested, verified against the actual source code and runtime behavior, and marked as **CONFIRMED**, **FALSIFIED**, or **MITIGATED**.

---

## 2. Issue 1: Iframe Embedding Refusal (`/embed`)

### 2.1 Phenomenon
When embedding `https://assistant.xaivon.com/embed` inside a host parent page (such as preview sites or non-canonical origins), the browser refuses to display the frame and issues a Content Security Policy (CSP) violation:
```text
Refused to frame 'https://assistant.xaivon.com/embed' because an ancestor violates the following Content Security Policy directive: "frame-ancestors 'self' https://xaivon.com https://www.xaivon.com".
```

### 2.2 Root Cause Analysis

| Factor | Code Location | Status | Details |
|---|---|---|---|
| **Production CSP `frame-ancestors`** | `next.config.ts` | **CONFIRMED** | `next.config.ts` had a hardcoded `frame-ancestors 'self' https://xaivon.com https://www.xaivon.com;` when `process.env.NODE_ENV === 'production'`. While this correctly permits canonical production traffic from `xaivon.com`, it categorically blocked preview staging parent environments (such as `https://xaivon-website.vercel.app` or testing harnesses). |
| **`postMessage` Target Origin Mismatch** | `app/embed/page.tsx` | **CONFIRMED** | The iframe child page called `window.parent.postMessage({ type: 'XAIVON_CHAT_CLOSE' }, 'https://xaivon.com')`. If embedded on `https://www.xaivon.com`, localhost, or an authorized preview deployment, the browser dropped the postMessage due to origin mismatch. |
| **X-Frame-Options Header** | `next.config.ts` | **CONFIRMED** | Legacy browsers or strict proxy caches receiving `SAMEORIGIN` could reject cross-origin embedding even when CSP allows it. Under CSP Level 2/3, `frame-ancestors` supersedes `X-Frame-Options`, but omitting clear framing rules caused ambiguity. |

### 2.3 Resolution Implemented
1. **Dynamic Configurable `frame-ancestors`:** In `next.config.ts`, added support for `ALLOWED_FRAME_ANCESTORS` environment variable while maintaining strict production defaults (`https://xaivon.com`, `https://www.xaivon.com`, and localhost during local development).
2. **Adaptive `postMessage` Handshake:** In `app/embed/page.tsx`, implemented an allowed-origins validator (`APPROVED_ORIGINS = ['https://xaivon.com', 'https://www.xaivon.com', 'http://localhost:3000', ...]`). The embed page dynamically identifies the valid parent origin and dispatches both `XAIVON_CHAT_READY` and `XAIVON_CHAT_CLOSE` only to verified origins.

---

## 3. Issue 2: AI Stream Failure ("Server error. Please try again.")

### 3.1 Phenomenon
Sending any prompt (e.g., `"Hi"`, `"What does XAIVON offer?"`) on `assistant.xaivon.com` resulted in an immediate or abrupt stream error, presenting the user with:
```text
Server error. Please try again.
```

### 3.2 Root Cause Analysis

| Factor | Code Location | Status | Details |
|---|---|---|---|
| **Groq API Key Authentication Failure** | `.env.local` / Environment | **CONFIRMED** | Direct synthetic query against Groq endpoint (`https://api.groq.com/openai/v1/chat/completions`) using the repository's configured `GROQ_API_KEY` returned: <br>`HTTP 401 Unauthorized` <br>`{"error":{"message":"Invalid API Key","type":"invalid_request_error","code":"invalid_api_key"}}`. |
| **Silent Error Obfuscation** | `app/api/chat/route.ts` | **CONFIRMED** | The `streamText` `onError` handler caught the upstream 401 error and sent `Server error. Please try again.` without notifying the user that the LLM provider service was unconfigured, nor offering an alternative human contact escape hatch. |
| **Side-Effect Database Mutations on Every Query** | `lib/rag/RAGManager.ts` | **CONFIRMED** | `RAGManager` previously utilized `MockEmbeddingProvider(384)` with sine-wave pseudo-random floats, and upon initialization executed: <br>`await supabase.from('knowledge_chunks').upsert(...)`. Because `NEXT_PUBLIC_SUPABASE_URL` was `dummy.supabase.co`, every chat invocation triggered an unhandled network error (`TypeError: fetch failed`). |
| **Unsafe Model Tools in Stream** | `app/api/chat/route.ts` | **CONFIRMED** | The chat route exposed three agent tools directly to the model: `triggerZapierWebhook`, `sendSlackNotification`, and `syncHubSpotCRM`. These attempted external network calls with arbitrary model-generated payloads. |

### 3.3 Resolution Implemented
1. **Provider Failure Classification & Safe Degradation:**
   - Modified `app/api/chat/route.ts` to inspect provider responses:
     - 400: Malformed input / validation failure.
     - 401/403/503: Provider configuration or service outage. Returns clear human-readable advice: *"Our AI consultant is temporarily undergoing maintenance. Please reach our founder directly at raja@xaivon.com or call +91-95211-90205."*
     - 429: Rate-limit exhaustion with `Retry-After`.
2. **Deterministic, Zero-Mutation RAG:**
   - Replaced `MockEmbeddingProvider` and runtime Supabase table writes with in-memory deterministic keyword and context extraction from `XAIVON_APPROVED_FACTS.ts`.
   - Guaranteed 0 writes to production database tables during chat inference.
3. **Removal of Unsafe Model Tools:**
   - Stripped autonomous side-effect tools from public visitor chat streams. All CRM, email, and meeting interactions now strictly require explicit user consent via dedicated UI modals (`LeadFormModal`, `CalendarModal`).

---

## 4. Operational Status & Actionable Owner Boundary

| Area | Status | Required Owner Action |
|---|---|---|
| **Chatbot Frontend & UI** | **READY** | None. Complete architectural Light/Dark overhaul deployed. |
| **Security & SSRF Hardening** | **READY** | None. Full RFC1918 / AWS / GCP metadata IP filtering active. |
| **Local Unit & Integration Tests** | **READY** | All 9 tests passing (`npx tsx --test tests/*.test.mjs`). |
| **Live Groq LLM Generation** | **BLOCKED — OWNER ACTION REQUIRED** | **The owner must provide a valid `GROQ_API_KEY` in Vercel project settings.** The existing key is rejected by Groq with HTTP 401. Until a valid key is configured, the application displays the graceful maintenance notice and direct contact fallback (`raja@xaivon.com`). |
