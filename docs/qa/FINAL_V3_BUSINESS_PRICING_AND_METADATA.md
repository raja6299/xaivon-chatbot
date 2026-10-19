# Final V3 Business Knowledge, Pricing Parity & SEO Metadata Specification

**Document Identifier:** `XAIVON-QA-PRICING-SEO-V3-20261019`  
**Target Repository:** `raja6299/xaivon-chatbot`  
**Date:** October 19, 2026  
**Status:** FACT-VERIFIED & IMPLEMENTED  

---

## 1. Business Knowledge & Pricing Truth Audit

### 1.1 Root Discrepancy Analysis
In earlier iterations, the chatbot's system prompt stated:
> *"All pricing is 100% custom; we do not quote any figures or ranges without an architectural discovery session."*

This statement directly contradicted the public marketing website (`xaivon.com/pricing`). The canonical source in `raja6299/xaivon-website/src/data/xaivonData.js` explicitly publishes **STARTING PRICE TIERS** across six operational automation categories.

### 1.2 Canonical Pricing Extraction from `xaivonData.js`
The following verified figures represent the published starting tiers for implementation across all 6 service categories:

| Category | Starter Tier | Plus Tier | Premium Tier |
|---|---|---|---|
| **1. Workflow & Automation** | **$749 USD** / **₹29,000 INR**<br>*(up to 3 workflows, single integration)* | **$1,249 USD** / **₹49,999 INR**<br>*(up to 8 workflows, multi-app sync)* | **$3,499 USD** / **₹1,49,000 INR**<br>*(enterprise orchestration, custom ERP/CRM)* |
| **2. AI Agents & Systems** | **$2,499 USD** / **₹99,000 INR**<br>*(single specialized task agent)* | **$5,499 USD** / **₹2,49,000 INR**<br>*(multi-agent pipeline, memory, tools)* | **$12,000 USD** / **₹5,99,000 INR**<br>*(autonomous operations suite)* |
| **3. Voice AI & Telephony** | **$2,999 USD** / **₹1,25,000 INR**<br>*(inbound routing, FAQ & appointments)* | **$5,499 USD** / **₹1,99,000 INR**<br>*(bi-directional, CRM sync, transfers)* | **$15,000+ USD** / **₹6,99,000 INR**<br>*(full contact center replacement)* |
| **4. Chatbot & Customer Support** | **$1,249 USD** / **₹49,000 INR**<br>*(web widget, FAQ knowledge base)* | **$2,499 USD** / **₹99,000 INR**<br>*(omnichannel, CRM integration, lead capture)* | **$6,000 USD** / **₹2,49,000 INR**<br>*(enterprise RAG, multi-lingual, self-hosted)* |
| **5. CRM, Lead & Data Automation** | **$999 USD** / **₹45,000 INR**<br>*(lead routing, enrichment, notifications)* | **$2,499 USD** / **₹1,09,000 INR**<br>*(full pipeline automation, attribution)* | **$6,000 USD** / **₹2,49,000 INR**<br>*(enterprise data warehouse sync & analytics)* |
| **6. Document & Business Process** | **$1,499 USD** / **₹59,000 INR**<br>*(PDF/invoice extraction, single format)* | **$2,999 USD** / **₹1,29,000 INR**<br>*(multi-format, approval routing, ERP)* | **$7,000 USD** / **₹2,99,000 INR**<br>*(end-to-end document intelligence pipeline)* |

> [!IMPORTANT]
> **Scoping Context Rule:**
> The chatbot now accurately answers price inquiries by quoting these exact published starting figures. It explicitly clarifies that these are **base starting implementation rates** and that final quotes depend on workflow discovery, custom integrations, API volume, and ongoing infrastructure costs.

---

## 2. Codebase Integration Points

1. `lib/knowledge/XAIVON_APPROVED_FACTS.ts`: Contains the canonical `XAIVON_OFFICIAL_PRICING` object exported for server routes and client references.
2. `lib/knowledge-base.json`: Updated all category nodes with the accurate starting rates in USD and INR.
3. `lib/rag/RAGManager.ts`: Added dedicated knowledge chunks for each category as well as a specialized **Logistics & Freight Automation** chunk covering customs clearance, bill of lading parsing, and freight forwarding tracking.
4. `app/api/chat/route.ts`: Injected `XAIVON_OFFICIAL_PRICING` into the `SYSTEM_PROMPT` so that the model directly references these numbers when answering visitor queries.

---

## 3. SEO Metadata, OpenGraph & Indexing Architecture

### 3.1 Metadata Configuration in `app/layout.tsx`
```typescript
export const metadata: Metadata = {
  title: 'XAIVON — AI Business Automation & Workflow Engineering Consultant',
  description:
    'Consult with XAIVON AI to automate workflows, build custom AI agents, deploy voice systems, and streamline business operations.',
  metadataBase: new URL('https://assistant.xaivon.com'),
  alternates: {
    canonical: 'https://assistant.xaivon.com',
  },
  openGraph: {
    title: 'XAIVON — AI Business Automation Consultant',
    description: 'Explore tailored automation solutions, starting tiers, and enterprise AI workflows.',
    url: 'https://assistant.xaivon.com',
    siteName: 'XAIVON',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'XAIVON AI Consultant' }],
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.png',
  },
};
```

### 3.2 Indexing Safeguards (`app/robots.ts`)
Search engine indexing is strictly partitioned to prevent indexing of internal interfaces:
- **Allowed:** `/` (Standalone AI Consultant page).
- **Disallowed (Noindex):**
  - `/embed` (Iframe embed endpoint for host site).
  - `/admin/*` (All admin and telemetry dashboards).
  - `/login` (Internal authentication).
  - `/api/*` (All API endpoints).
- Preview deployments on Vercel automatically emit the `X-Robots-Tag: noindex, nofollow` HTTP response header.

### 3.3 Structured Data (`JSON-LD`)
Injected in `app/page.tsx` as a `SoftwareApplication` / `Organization` schema linking `assistant.xaivon.com` to the primary brand entity at `https://xaivon.com`.
