# XAIVON CHATBOT V2 — BUSINESS FACTS, PRICING TRUTHFULNESS & SEO SPECIFICATION

**Document Date:** October 20, 2026  
**Repository:** `raja6299/xaivon-chatbot`  
**Host:** `assistant.xaivon.com`  
**Parent Source of Truth:** `https://xaivon.com` (Read-only reference)

---

## 1. Field-by-Field Pricing Discrepancy & Reconciliation Table

A thorough audit of legacy files (`lib/knowledge/XAIVON_APPROVED_FACTS.ts` and `lib/knowledge-base.json`) revealed hardcoded package prices that contradicted official XAIVON business operations.

| Offering / Service Area | Legacy Chatbot Claim | Reconciled Live Fact (`xaivon.com`) | Resolution in V2 Codebase |
| :--- | :--- | :--- | :--- |
| **Custom AI Chatbot** | `$499–$1,299 / month` | Custom scoped upon operational assessment | Removed all fixed dollar tiers. Guidance strictly explains custom scoping based on integration complexity and message volume. |
| **Logistics & Freight Automation** | `$799–$1,999 / month` | Custom scoped enterprise engagement | Removed dollar tiers. Guidance directs prospective freight partners to discovery with founder Raja Babu. |
| **Enterprise Workflow Automation** | `$1,499+ / month` | Scoped enterprise implementation | Removed dollar tiers. Emphasizes tailored SLA and TMS/WMS integration architecture. |
| **Full Architecture Overhaul** | `$4,999+ implementation` | Dedicated advisory & technical deployment | Purged unverified figures; focuses on advisory discovery. |

### 1.1 Truthful LLM System Prompt Policy
In `app/api/chat/route.ts`, the model's instructions explicitly forbid fabricating fixed package prices:
> *"PRICING POLICY: DO NOT invent fixed dollar package figures (e.g., $499 or $1,499). Explain that all XAIVON implementations are custom-scoped based on workflow volume, ERP/TMS integration depth, and compliance requirements. Offer a direct discovery call with founder Raja Babu for tailored commercial scoping."*

---

## 2. Categorical Claims Audit & Remediation

| Categorical Claim | Legacy Wording | Remediated Wording | Rationale |
| :--- | :--- | :--- | :--- |
| **System Status** | *"Consultant System Operational"* | *"XAIVON AI Business Consultant • Logistics & Enterprise Discovery"* | Do not display hardcoded 100% operational uptime without real-time telemetry. |
| **RAG Security** | *"Zero-leakage RAG"* | *"In-memory deterministic knowledge retrieval with verified business facts"* | Avoid certifying absolute security boundaries without independent third-party penetration testing. |
| **Data Protection** | *"Confidential enterprise systems"* | *"Enterprise-grade data boundaries with PII redaction"* | Professional, legally defensible security description. |
| **Lead Capture** | *"Zero-loss lead deduplication"* | *"Reliable lead deduplication with unique database constraints"* | Accurate technical claim without absolute mathematical guarantees. |
| **Telephony** | *"Autonomous telephony & dispatch"* | *"Engineered workflow integrations designed during scoped engagement"* | Transparent representation of capabilities. |

---

## 3. SEO, Crawl Directives & Structured Data

### 3.1 Domain Role Separation
- Primary brand search rankings belong strictly to the marketing website at `xaivon.com`.
- `assistant.xaivon.com` operates as a dedicated standalone assistant and embed provider.

### 3.2 Route Indexing Directives
| Route | Indexing Status | Configuration Location |
| :--- | :--- | :--- |
| `/` | `index: true, follow: true` | `app/layout.tsx` |
| `/embed` | `index: false, follow: false` | `app/embed/layout.tsx` & `app/robots.ts` |
| `/login` | `index: false, follow: false` | `app/login/layout.tsx` & `app/robots.ts` |
| `/admin/*` | `index: false, follow: false` | `app/admin/layout.tsx` & `app/robots.ts` |
| `/api/*` | Disallowed in robots.txt | `app/robots.ts` |

### 3.3 Assets & Structured Data
- **JSON-LD Schema:** Serves valid schema markup for `SoftwareApplication` and `Organization` referencing `https://assistant.xaivon.com/logo.png`.
- **OpenGraph & Twitter Cards:** Correctly configured with `https://assistant.xaivon.com/og-image.png`.
