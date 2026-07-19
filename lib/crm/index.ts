import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

export interface CRMLeadPayload {
  leadInformation: {
    fullName: string;
    email: string;
    company: string;
    phone: string | null;
  };
  businessInformation: {
    industry: string;
    companySize: string;
    painPoints: string[];
    currentSoftware: string[];
    budget: string;
    timeline: string;
    decisionMaker: string;
  };
  conversationSummary: string;
  leadScore: number;
  recommendedService: string;
  intentLevel: 'Low' | 'Medium' | 'High';
  qualificationStatus: 'Unqualified' | 'Qualified' | 'Highly Qualified';
  escalationStatus: 'None' | 'Pending' | 'Escalated';
  meetingRequested: boolean;
  meetingType: 'Discovery Call' | 'Strategy Session' | 'Technical Consultation' | 'AI Assessment' | 'Demo Session' | 'None';
  assignedSalesStage: 'New' | 'Discovery' | 'Qualified' | 'Proposal';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  followUpRecommendation: string;
  handoffReason: string;
  salesNotes: string;
  timestamp: string;
  sessionId: string;
}

export interface FormDataPayload {
  fullName: string;
  email: string;
  company: string;
  phone?: string | null;
}

/**
 * Calculates a configurable lead score based on the conversation history and provided form data.
 */
export function calculateLeadScore(messages: Array<{ role: string; content: string }>, formData: FormDataPayload): number {
  let score = 0;
  const fullText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  // Base scoring on provided info
  if (formData.company && formData.company.length > 0) score += 10;
  if (formData.phone && formData.phone.length > 0) score += 10;

  // Keyword scoring
  if (fullText.includes('pricing') || fullText.includes('cost') || fullText.includes('how much')) score += 20;
  if (fullText.includes('demo') || fullText.includes('book') || fullText.includes('call') || fullText.includes('meeting')) score += 30;
  if (fullText.includes('automation') || fullText.includes('automate')) score += 25;
  if (fullText.includes('budget')) score += 15;
  if (fullText.includes('timeline') || fullText.includes('soon') || fullText.includes('urgent') || fullText.includes('month') || fullText.includes('week')) score += 10;
  if (fullText.includes('ceo') || fullText.includes('founder') || fullText.includes('owner') || fullText.includes('manager') || fullText.includes('director')) score += 15;

  return Math.min(score, 100);
}

/**
 * Uses LLM to extract structured lead intelligence from the conversation history.
 */
export async function generateLeadIntelligence(messages: Array<{ role: string; content: string }>) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const conversationText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  const { object } = await generateObject({
    model: groq('llama-3.3-70b-versatile'),
    schema: z.object({
      industry: z.string().describe('The industry the user belongs to, or "Unknown"'),
      companySize: z.string().describe('The company size mentioned, or "Unknown"'),
      painPoints: z.array(z.string()).describe('List of pain points or problems mentioned'),
      currentSoftware: z.array(z.string()).describe('Any software tools they currently use'),
      budget: z.string().describe('Mentioned budget, or "Unknown"'),
      timeline: z.string().describe('Mentioned timeline, or "Unknown"'),
      decisionMaker: z.string().describe('Role of the user if mentioned (e.g., CEO, Founder), or "Unknown"'),
      conversationSummary: z.string().describe('A short, 2-3 sentence executive summary of what the lead wants'),
      recommendedService: z.string().describe('The best matching XAIVON service: Website Development, Logistics Automation, AI Chatbot, AI Agents, or AI Automation'),
      intentLevel: z.enum(['Low', 'Medium', 'High']).describe('Estimate of buying intent based on the conversation'),
      escalationStatus: z.enum(['None', 'Pending', 'Escalated']).describe('Whether the user requested to speak to a human'),
      meetingRequested: z.boolean().describe('Did the user agree to or request a meeting?'),
      meetingType: z.enum(['Discovery Call', 'Strategy Session', 'Technical Consultation', 'AI Assessment', 'Demo Session', 'None']).describe('The most appropriate meeting type'),
      priority: z.enum(['Low', 'Medium', 'High', 'Critical']).describe('Priority based on budget and intent'),
      followUpRecommendation: z.string().describe('What the human sales rep should do next'),
      handoffReason: z.string().describe('Why this is being escalated (e.g. "Requested demo", "High budget", "Legal discussion"), or "None"'),
    }),
    prompt: `Analyze the following chatbot conversation between a user and XAIVON (an enterprise AI agency). Extract the business intelligence for the CRM.\n\nConversation:\n${conversationText}`,
  });

  return object;
}

/**
 * Builds the complete provider-independent CRM payload.
 */
export async function buildCRMPayload(
  formData: FormDataPayload,
  messages: Array<{ role: string; content: string }>,
  sessionId: string
): Promise<CRMLeadPayload> {
  const score = calculateLeadScore(messages, formData);
  
  // Try to generate intelligence, fallback if it fails to prevent blocking submission
  let intelligence;
  try {
    intelligence = await generateLeadIntelligence(messages);
  } catch {
    // Fallback if LLM extraction fails
    intelligence = {
      industry: 'Unknown',
      companySize: 'Unknown',
      painPoints: [],
      currentSoftware: [],
      budget: 'Unknown',
      timeline: 'Unknown',
      decisionMaker: 'Unknown',
      conversationSummary: 'Extraction failed or skipped.',
      recommendedService: 'Needs Manual Review',
      intentLevel: score > 50 ? 'High' : (score > 20 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High',
      escalationStatus: score > 50 ? 'Pending' : 'None' as 'None' | 'Pending' | 'Escalated',
      meetingRequested: score > 50,
      meetingType: score > 50 ? 'Discovery Call' : 'None' as 'Discovery Call' | 'None',
      priority: score > 70 ? 'High' : (score > 40 ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High' | 'Critical',
      followUpRecommendation: 'Review manually due to extraction failure.',
      handoffReason: score > 50 ? 'High score manual fallback' : 'None',
    };
  }

  const qualificationStatus = score >= 70 ? 'Highly Qualified' : (score >= 40 ? 'Qualified' : 'Unqualified');
  const assignedSalesStage = intelligence.meetingRequested ? 'Discovery' : 'New';

  return {
    leadInformation: {
      fullName: formData.fullName,
      email: formData.email,
      company: formData.company,
      phone: formData.phone || null,
    },
    businessInformation: {
      industry: intelligence.industry,
      companySize: intelligence.companySize,
      painPoints: intelligence.painPoints,
      currentSoftware: intelligence.currentSoftware,
      budget: intelligence.budget,
      timeline: intelligence.timeline,
      decisionMaker: intelligence.decisionMaker,
    },
    conversationSummary: intelligence.conversationSummary,
    leadScore: score,
    recommendedService: intelligence.recommendedService,
    intentLevel: intelligence.intentLevel,
    qualificationStatus,
    escalationStatus: intelligence.escalationStatus,
    meetingRequested: intelligence.meetingRequested,
    meetingType: intelligence.meetingType,
    assignedSalesStage,
    priority: intelligence.priority,
    followUpRecommendation: intelligence.followUpRecommendation,
    handoffReason: intelligence.handoffReason,
    salesNotes: `System Generated: Lead score is ${score}. Intent is ${intelligence.intentLevel}.`,
    timestamp: new Date().toISOString(),
    sessionId,
  };
}

/**
 * Main entry point for the CRM integration layer.
 * Processes the lead, logs the internal summary, and returns the payload.
 * In a real implementation, this would push to HubSpot/Salesforce via adapters.
 */
export async function processLeadForCRM(
  formData: FormDataPayload,
  messages: Array<{ role: string; content: string }>,
  sessionId: string
) {
  const crmPayload = await buildCRMPayload(formData, messages, sessionId);
  
  // "Do NOT show this summary to users. Internal use only."
  // Simulate pushing to an internal CRM by logging securely on the backend.


  return crmPayload;
}
