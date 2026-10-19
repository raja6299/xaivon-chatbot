/**
 * XAIVON APPROVED BUSINESS FACTS (Single Source of Truth)
 * Version: 2026.2 (Fact-Verified against xaivon-website/src/data/xaivonData.js on 19 Oct 2026)
 * Reference: https://xaivon.com/pricing & src/data/xaivonData.js
 */

export interface PricingTier {
  name: string;
  purpose: string;
  price: {
    USD: string;
    INR: string;
  };
  features: string[];
}

export interface ServiceOffering {
  id: string;
  category: string;
  title: string;
  description: string;
  features: string[];
  startingTiers: PricingTier[];
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
      id: 'workflow-automation',
      category: 'Workflow & Automation',
      title: 'Workflow & Business Process Automation',
      description: 'End-to-end automation connecting core business systems, eliminating manual data entry, and streamlining operations.',
      features: [
        'Multi-app workflow pipelines',
        'Conditional logic and error handling',
        'CRM/email/data connectivity',
        'Human handoff and approval checkpoints',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$749', INR: '₹29,000' },
          features: ['One bounded workflow', 'Limited integrations', 'Basic business rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$1,249', INR: '₹49,999' },
          features: ['Multiple workflow steps', 'Multiple integrations', 'CRM/email/data connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$3,499', INR: '₹1,49,000' },
          features: ['Complex multi-step workflows', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $749 USD (₹29,000 INR), Plus from $1,249 USD (₹49,999 INR), Premium from $3,499 USD (₹1,49,000 INR). Final quote depends on workflow steps and integration complexity.',
    },
    {
      id: 'ai-agents',
      category: 'AI Agents',
      title: 'Operational AI Agents & Assistance',
      description: 'Autonomous goal-driven agents capable of executing multi-step reasoning, data extraction, and tool orchestration.',
      features: [
        'Bounded single or multi-agent architectures',
        'Tool execution and database querying',
        'Validation, guardrails, and human review',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$2,499', INR: '₹99,000' },
          features: ['One bounded agent', 'Limited tool access', 'Basic business rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$5,499', INR: '₹2,49,000' },
          features: ['Multiple connected agents', 'Multiple integrations', 'CRM/data connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$12,000', INR: '₹5,99,000' },
          features: ['Complex multi-agent workflows', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $2,499 USD (₹99,000 INR), Plus from $5,499 USD (₹2,49,000 INR), Premium from $12,000 USD (₹5,99,000 INR). Final quote tailored based on agent autonomy and tool integrations.',
    },
    {
      id: 'voice-ai',
      category: 'Voice AI',
      title: 'Voice AI & Inbound Telephony Systems',
      description: 'Intelligent conversational telephony handling high-volume calls, customer qualification, and automated appointment routing.',
      features: [
        'Natural speech synthesis and low-latency transcription',
        'Inbound call triage and appointment scheduling',
        'CRM record creation and team alerting',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$2,999', INR: '₹1,25,000' },
          features: ['One bounded voice agent', 'Limited integrations', 'Basic routing rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$5,499', INR: '₹1,99,000' },
          features: ['Advanced voice agent', 'Multiple integrations', 'CRM connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$15,000+', INR: '₹6,99,000' },
          features: ['Complex multi-step workflows', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $2,999 USD (₹1,25,000 INR), Plus from $5,499 USD (₹1,99,000 INR), Premium from $15,000+ USD (₹6,99,000 INR). Telephony provider and minute costs billed separately.',
    },
    {
      id: 'chatbot-support',
      category: 'Chatbot & Customer Support',
      title: 'AI Chatbot & Support Systems',
      description: 'Context-aware customer qualification, domain Q&A, and direct human handoff embedded into web and mobile platforms.',
      features: [
        'Knowledge base retrieval with verified facts',
        'Multi-lingual English, Hindi, and Hinglish dialogue',
        'Lead qualification and calendar booking',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$1,249', INR: '₹49,000' },
          features: ['Basic FAQ chatbot', 'Limited knowledge base', 'Basic business rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$2,499', INR: '₹99,000' },
          features: ['Advanced support chatbot', 'Multiple integrations', 'CRM/email connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$6,000', INR: '₹2,49,000' },
          features: ['Omnichannel support systems', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $1,249 USD (₹49,000 INR), Plus from $2,499 USD (₹99,000 INR), Premium from $6,000 USD (₹2,49,000 INR). Custom quotes depend on knowledge base size and integration points.',
    },
    {
      id: 'crm-lead-data',
      category: 'CRM, Lead & Data Automation',
      title: 'CRM, Lead & Data Pipeline Automation',
      description: 'Structured pipelines synchronizing customer records, inbound inquiries, and database events across enterprise stacks.',
      features: [
        'Reliable deduplication and enrichment',
        'Multi-system CRM synchronization',
        'Data encryption and audit tracking',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$999', INR: '₹45,000' },
          features: ['Basic CRM sync', 'Limited integrations', 'Basic data rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$2,499', INR: '₹1,09,000' },
          features: ['Multi-system CRM sync', 'Lead routing & enrichment', 'Email automation connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$6,000', INR: '₹2,49,000' },
          features: ['Complex data pipelines', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $999 USD (₹45,000 INR), Plus from $2,499 USD (₹1,09,000 INR), Premium from $6,000 USD (₹2,49,000 INR). Quotes reflect data volume and schema endpoints.',
    },
    {
      id: 'document-automation',
      category: 'Document & Business Process Automation',
      title: 'Document & Business Process Automation',
      description: 'Automated document ingestion, data extraction, and verification for freight bills of lading, invoices, and contracts.',
      features: [
        'Automated document extraction and parsing',
        'Structured ERP/TMS database insertion',
        'Exception flagging and human-in-the-loop validation',
      ],
      startingTiers: [
        {
          name: 'Starter',
          purpose: 'Focused implementation',
          price: { USD: '$1,499', INR: '₹59,000' },
          features: ['Basic document extraction', 'Limited integrations', 'Basic business rules', 'Standard testing', 'Basic deployment', 'Defined support period'],
        },
        {
          name: 'Plus',
          purpose: 'Connected business automation',
          price: { USD: '$2,999', INR: '₹1,29,000' },
          features: ['Advanced document processing', 'Multiple integrations', 'ERP/Data connectivity', 'Conditional logic', 'Validation & error handling', 'Human handoff/approval'],
        },
        {
          name: 'Premium',
          purpose: 'Complex operational systems',
          price: { USD: '$7,000', INR: '₹2,99,000' },
          features: ['Complex process automation', 'Multiple systems/tools', 'Advanced routing/rules', 'Broader monitoring', 'Stronger evaluation/testing', 'Advanced integrations'],
        },
      ],
      priceGuidance: 'Starting implementation rates: Starter from $1,499 USD (₹59,000 INR), Plus from $2,999 USD (₹1,29,000 INR), Premium from $7,000 USD (₹2,99,000 INR). Quotes depend on format diversity and processing volume.',
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
    'Logistics TMS & WMS Systems',
  ],

  implementationProcess: [
    '1. Operational Discovery — Review current manual processes and identify high-friction bottlenecks.',
    '2. Architecture Design — Map exact data flows, security boundaries, and integration touchpoints.',
    '3. Engineering & Testing — Build production-grade agents and pipelines with deterministic fallback.',
    '4. Staged Deployment — Supervised rollout with human oversight and validation.',
    '5. Monitoring & Maintenance — Continuous latency, error-budget, and performance tracking.',
  ],

  disclaimers: {
    pricing: 'Published rates on xaivon.com/pricing are starting implementation figures for defined deliverables. Exact commercial proposals are tailored following discovery based on workflow complexity, volume, integration endpoints, and third-party software/model costs. Connect directly with founder Raja Babu at raja@xaivon.com or schedule via https://calendly.com/xaivon.',
    guarantees: 'XAIVON partners with businesses on measurable throughput improvements; exact SLA and operational guarantees are defined in formal written service agreements.',
  },
};
