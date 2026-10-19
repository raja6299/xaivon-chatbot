/**
 * XAIVON APPROVED BUSINESS FACTS (Single Source of Truth)
 * Version: 2026.1
 * Verification Date: 2026-10-19
 * Reference: https://xaivon.com (public website JSON-LD & service catalog)
 */

export interface ServiceOffering {
  id: string;
  category: string;
  title: string;
  description: string;
  features: string[];
  pricingModel: 'custom_scoped' | 'tiered_guidance';
  priceGuidance: string;
}

export interface ApprovedCompanyFacts {
  brandName: string;
  legalEntity: string;
  entityType: string;
  founder: string;
  founderTitle: string;
  email: string;
  phone: string;
  website: string;
  geographiesServed: string[];
  primaryFocus: string;
  services: ServiceOffering[];
  integrations: string[];
  implementationProcess: string[];
  disclaimers: {
    pricing: string;
    guarantees: string;
  };
}

export const XAIVON_APPROVED_FACTS: ApprovedCompanyFacts = {
  brandName: 'XAIVON',
  legalEntity: 'ADABHRA GROUP',
  entityType: 'Sole Proprietorship, India',
  founder: 'Raja Babu',
  founderTitle: 'Founder & CEO',
  email: 'raja@xaivon.com',
  phone: '+91-95211-90205',
  website: 'https://xaivon.com',
  geographiesServed: ['India', 'United States', 'Canada', 'United Kingdom', 'Australia'],
  primaryFocus: 'AI Automation, Workflow Orchestration & Connected Business Infrastructure',

  services: [
    {
      id: 'ai-automation',
      category: 'Workflow Automation',
      title: 'AI Automation & Workflow Orchestration',
      description: 'End-to-end automation connecting core business systems, eliminating manual data entry, and streamlining internal operations.',
      features: [
        'Multi-app workflow pipelines',
        'Document and data extraction pipelines',
        'Custom API integration between legacy and modern software',
        'Exception alerting and human-in-the-loop review',
      ],
      pricingModel: 'custom_scoped',
      priceGuidance: 'Custom-scoped on assessment based on workflow complexity, system volume, and integration endpoints. Requires operational discovery with founder Raja Babu.',
    },
    {
      id: 'ai-chatbots',
      category: 'Conversational AI',
      title: 'AI Chatbots & Inbound Assistants',
      description: 'Intelligent conversational interfaces that qualify leads, answer detailed domain questions, and integrate with CRM platforms.',
      features: [
        'Context-aware knowledge base retrieval',
        'Multi-language and natural vernacular support (English, Hindi, Hinglish)',
        'Explicit consentful lead qualification',
        'Seamless human handoff to direct email/calendar booking',
      ],
      pricingModel: 'custom_scoped',
      priceGuidance: 'Custom-scoped on assessment based on domain scope, knowledge base size, and CRM integration depth. Evaluated individually upon discovery.',
    },
    {
      id: 'voice-ai',
      category: 'Voice AI Agents',
      title: 'AI Voice Agents & Inbound Call Assistance',
      description: 'Autonomous voice agents handling high-volume telephone inquiries, appointment scheduling, and initial qualification.',
      features: [
        'Natural speech synthesis and transcription',
        'Call routing and structured data capture',
        'CRM record creation and team notification',
      ],
      pricingModel: 'custom_scoped',
      priceGuidance: 'Custom-scoped on assessment based on anticipated call minutes, telephony provider infrastructure, and customized conversational requirements.',
    },
    {
      id: 'logistics-ai',
      category: 'Logistics & Supply Chain',
      title: 'Logistics & Freight Workflow Automation',
      description: 'Specialized workflow solutions for freight brokers, carriers, and dispatch operations to speed up quote cycles and tracking.',
      features: [
        'Automated load intake and quote request parsing',
        'Document processing for bills of lading, rate confirmations, and invoices',
        'Carrier communication pipelines',
      ],
      pricingModel: 'custom_scoped',
      priceGuidance: 'Custom-scoped on assessment based on daily load volume, document parsing complexity (BOLs, rate cons), and dispatch software integration points.',
    },
    {
      id: 'crm-data',
      category: 'Data & CRM Systems',
      title: 'CRM, Lead & Data Pipeline Automation',
      description: 'Structured synchronization across HubSpot, Salesforce, Google Workspace, and internal operational databases.',
      features: [
        'Reliable lead deduplication and structured data enrichment',
        'Real-time webhook and event-driven data piping',
        'Safe data encryption and audit tracking',
      ],
      pricingModel: 'custom_scoped',
      priceGuidance: 'Custom-scoped on assessment based on schema complexity, record volume, synchronization frequency, and destination endpoints.',
    },
  ],

  integrations: [
    'HubSpot',
    'Salesforce',
    'Slack',
    'Microsoft Teams',
    'Google Workspace',
    'QuickBooks',
    'Custom REST APIs & Webhooks',
  ],

  implementationProcess: [
    '1. Operational Discovery — Review current manual processes and identify high-friction bottlenecks.',
    '2. Architecture Design — Map exact data flows, security boundaries, and integration touchpoints.',
    '3. Engineering & Testing — Build production-grade agents and pipelines with deterministic fallback.',
    '4. Staged Deployment — Supervised rollout with human oversight and validation.',
    '5. Monitoring & Maintenance — Continuous latency, error-budget, and performance tracking.',
  ],

  disclaimers: {
    pricing: 'All pricing is strictly custom-scoped based on discovery and architecture assessment. XAIVON does not offer fixed-tier self-serve packages without an operational evaluation. To receive a tailored scope and investment estimate, contact Raja Babu directly at raja@xaivon.com or schedule via https://calendly.com/xaivon.',
    guarantees: 'XAIVON partners with businesses on measurable throughput improvements; exact SLA and operational guarantees are defined in formal written service agreements.',
  },
};
