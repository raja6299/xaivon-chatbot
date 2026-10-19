import { SearchResult } from './types';
import { XAIVON_APPROVED_FACTS } from '../knowledge/XAIVON_APPROVED_FACTS';
import { knowledgeBase } from '../knowledge-base';

interface KnowledgeChunk {
  id: string;
  source: string;
  section: string;
  text: string;
  keywords: string[];
}

export class RAGManager {
  private static instance: RAGManager;
  private chunks: KnowledgeChunk[] = [];
  private isInitialized = false;

  private constructor() {
    this.buildKnowledgeChunks();
  }

  public static getInstance(): RAGManager {
    if (!RAGManager.instance) {
      RAGManager.instance = new RAGManager();
    }
    return RAGManager.instance;
  }

  private buildKnowledgeChunks() {
    const chunks: KnowledgeChunk[] = [];

    // Chunk 1: Company Profile & Founder
    chunks.push({
      id: 'company-overview',
      source: 'XAIVON Approved Facts',
      section: 'Company Profile',
      text: `${XAIVON_APPROVED_FACTS.brandName} (operated by ${XAIVON_APPROVED_FACTS.legalEntity}, ${XAIVON_APPROVED_FACTS.entityType}) is an AI infrastructure and workflow orchestration consultancy founded by ${XAIVON_APPROVED_FACTS.founder} (${XAIVON_APPROVED_FACTS.founderTitle}). Contact email: ${XAIVON_APPROVED_FACTS.email}, Phone: ${XAIVON_APPROVED_FACTS.phone}. Serving clients across: ${XAIVON_APPROVED_FACTS.geographiesServed.join(', ')}.`,
      keywords: ['xaivon', 'adabhra', 'raja', 'founder', 'ceo', 'company', 'location', 'phone', 'contact', 'email', 'about', 'who']
    });

    // Chunk 2: Services & Offerings
    for (const service of XAIVON_APPROVED_FACTS.services) {
      chunks.push({
        id: `service-${service.id}`,
        source: 'XAIVON Approved Facts',
        section: service.title,
        text: `### ${service.title}\nCategory: ${service.category}\nDescription: ${service.description}\nCapabilities:\n${service.features.map(f => `- ${f}`).join('\n')}\nPricing Policy: ${service.priceGuidance}`,
        keywords: [
          ...service.title.toLowerCase().split(/\s+/),
          ...service.category.toLowerCase().split(/\s+/),
          service.id,
          'service',
          'features',
          'capability',
          'pricing',
          'cost',
          'price'
        ]
      });
    }

    // Chunk 3: Integrations & Tech Stack
    chunks.push({
      id: 'supported-integrations',
      source: 'XAIVON Approved Facts',
      section: 'Supported Integrations',
      text: `XAIVON integrates with core business tools including: ${XAIVON_APPROVED_FACTS.integrations.join(', ')}, plus custom REST APIs, databases (PostgreSQL/Supabase), and secure event webhooks.`,
      keywords: ['integration', 'integrations', 'hubspot', 'slack', 'salesforce', 'quickbooks', 'teams', 'tools', 'connect', 'api', 'webhook']
    });

    // Chunk 4: Implementation Process
    chunks.push({
      id: 'implementation-process',
      source: 'XAIVON Approved Facts',
      section: 'Delivery & Deployment Process',
      text: `XAIVON Implementation Methodology:\n${XAIVON_APPROVED_FACTS.implementationProcess.join('\n')}\nTimeline: Starter automations deploy in 1–2 weeks; enterprise multi-agent workflows typically 3–6 weeks.`,
      keywords: ['timeline', 'process', 'how long', 'weeks', 'deploy', 'implementation', 'steps', 'audit', 'discovery']
    });

    // Chunk 5: FAQ & Policies
    for (let i = 0; i < knowledgeBase.faq.length; i++) {
      const faq = knowledgeBase.faq[i];
      chunks.push({
        id: `faq-${i + 1}`,
        source: 'XAIVON Knowledge Base FAQ',
        section: 'Frequently Asked Questions',
        text: `Q: ${faq.question}\nA: ${faq.answer}`,
        keywords: [
          ...faq.question.toLowerCase().split(/\W+/).filter(w => w.length > 2),
          'faq',
          'question'
        ]
      });
    }

    this.chunks = chunks;
    this.isInitialized = true;
  }

  public async initializeWithDefaults(): Promise<void> {
    if (!this.isInitialized) {
      this.buildKnowledgeChunks();
    }
  }

  /**
   * Deterministic keyword & token matching retrieval.
   * Read-only, zero network calls, zero external side effects.
   */
  public async retrieveContext(query: string, topK: number = 4, threshold: number = 0.1): Promise<SearchResult[]> {
    if (!query || query.trim() === '') return [];

    const normalizedQuery = query.toLowerCase().trim();
    const queryTokens = normalizedQuery.split(/\W+/).filter(token => token.length > 2);

    if (queryTokens.length === 0) return [];

    const scored = this.chunks.map(chunk => {
      let score = 0;
      const lowerText = chunk.text.toLowerCase();
      const lowerSection = chunk.section.toLowerCase();

      // Direct phrase match
      if (lowerText.includes(normalizedQuery)) {
        score += 3.0;
      }

      // Keyword & token matches
      for (const token of queryTokens) {
        if (chunk.keywords.includes(token)) {
          score += 1.5;
        }
        if (lowerSection.includes(token)) {
          score += 1.0;
        }
        if (lowerText.includes(token)) {
          score += 0.5;
        }
      }

      // Normalize score between 0 and 1
      const normalizedScore = Math.min(score / (queryTokens.length * 2.5 || 1), 1.0);

      return {
        id: chunk.id,
        text: chunk.text,
        metadata: {
          documentId: chunk.id,
          documentName: chunk.source,
          source: 'Internal Verified Facts',
          section: chunk.section,
          uploadTime: '2026-10-19'
        },
        score: normalizedScore
      };
    });

    const filtered = scored.filter(item => item.score >= threshold);
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, topK);
  }

  public async addDocument(): Promise<void> {
    // No-op for read-only safety in production
  }

  public async removeDocument(): Promise<void> {
    // No-op for read-only safety in production
  }
}
