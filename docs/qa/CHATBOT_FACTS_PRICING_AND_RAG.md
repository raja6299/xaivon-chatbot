# XAIVON Chatbot — Knowledge Base, Pricing Truthfulness & RAG Architecture

**Document Version:** 1.0.0
**Source of Truth:** `lib/knowledge/XAIVON_APPROVED_FACTS.ts`
**Date:** October 19, 2026

---

## 1. Single Source of Truth (`XAIVON_APPROVED_FACTS.ts`)

To prevent model hallucinations, false pricing claims, or invented corporate credentials, the chatbot's entire business knowledge base is consolidated into a single versioned file: `lib/knowledge/XAIVON_APPROVED_FACTS.ts`.

### 1.1 Verified Brand Identity
- **Brand Name:** XAIVON
- **Legal Entity:** ADABHRA GROUP
- **Founder & CEO:** Raja Babu
- **Official Contact Email:** `raja@xaivon.com`
- **Official Contact Phone:** `+91-95211-90205`
- **Official Website:** `https://xaivon.com`
- **Consultant Domain:** `https://assistant.xaivon.com`
- **Direct Scheduling:** `https://calendly.com/xaivon`
- **Geographies Served:** India, United States, Canada, United Kingdom, and global remote enterprises.

---

## 2. Real vs. Falsified Service Offerings

### 2.1 Approved Live Service Offerings

1. **AI Automation & Workflow Orchestration:** Custom workflow pipelines, multi-application sync, document processing, and human-in-the-loop exception handling.
2. **AI Chatbots & Inbound Assistants:** Context-aware domain assistants with multi-language capability (English, Hindi, Hinglish), structured lead capture, and CRM handoff.
3. **AI Voice Agents & Inbound Call Assistance:** Telephony integration, call routing, and appointment scheduling.
4. **Logistics & Freight Workflow Automation:** Freight dispatch pipelines, load intake automation, BOL and rate confirmation parsing.
5. **CRM, Lead & Data Pipeline Automation:** High-integrity data synchronization across HubSpot, Salesforce, Slack, Microsoft Teams, and custom REST APIs.

### 2.2 Stale / Contradictory Claims Removed
- **Removed Fake Fixed Subscriptions:** Prior system prompt contained hardcoded $2,500/month packages that contradicted public business terms.
- **Removed Exaggerated Capabilities:** Phrases promising "instant zero-code complete TMS replacement" or "unlimited 24/7 autonomous telephony without setup" have been purged.
- **Removed Invented Case Studies:** All metrics now reference verifiable workflow improvements rather than fabricated client logos.

---

## 3. Honest Pricing Policy

The XAIVON chatbot enforces a strict truthfulness policy regarding project pricing:
1. **Scope-Dependent Guidance:** All pricing is explicitly scoped based on workflow complexity, system integration volume, and custom requirements.
2. **Starter Guidance Range:**
   - Single-purpose website assistants: typically $499–$1,299+.
   - Workflow automation pipelines: typically $799–$1,999+.
   - Freight & logistics multi-agent pipelines: typically $1,499–$4,999+.
3. **Never Guess:** If a visitor asks for an exact quote on a complex bespoke architecture, the assistant explicitly states:
   > *"Exact project investment depends on your specific workflow architecture, number of integrated systems, and transaction volume. We scope every deployment during an initial assessment with our founder. Would you like to connect directly with Raja Babu at raja@xaivon.com or schedule a quick discovery call?"*

---

## 4. Deterministic, Zero-Mutation RAG Strategy

### 4.1 Prior Architecture Flaw
The previous `RAGManager` implementation used:
- A `MockEmbeddingProvider(384)` with sine-wave pseudo-random floats.
- Automatic writes to the Supabase `knowledge_chunks` table on every user request.
- Because the Supabase database URL was set to `dummy.supabase.co`, this created runtime connection exceptions on every query.

### 4.2 Hardened In-Memory RAG Engine
1. **Deterministic In-Memory Corpus:** Knowledge chunks are generated directly from `XAIVON_APPROVED_FACTS.ts` and loaded into memory on module start.
2. **Token & Keyword Relevance Scoring:**
   - Query text is normalized, lowercased, and tokenized (stripping punctuation and common stop words).
   - Each chunk receives a weighted score based on exact keyword matches, phrase matches, and topic density.
   - Chunks exceeding the relevance threshold are formatted as verified context and injected into the LLM system prompt.
3. **Zero Database Mutation:** The RAG system performs 0 database writes, ensuring complete immutability and instant response times (<2ms).
4. **Automated Verification:** Verified in `tests/rag_and_facts.test.mjs` across logistics automation queries, founder identity checks, and pricing philosophy tests.
