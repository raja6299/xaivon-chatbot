import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Critical API Route Error: OPENAI_API_KEY is undefined in process.env");
  }
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are the Virtual Sales Architect for XAIVON. 
      Knowledge Base: Logistics Solutions: Starter ($1499), Growth ($2499 incl. QuoteFlow AI), Enterprise ($4999+). 
      AI Agents: Single ($1499), Multi-Agent ($3499), Custom. 
      AI Chatbots: Basic ($499), Support Assistant ($1299), Voice AI (Custom). 
      AI Automation: Starter ($799), Business ($1999), Custom.
      Tone: Professional, consultative. If user asks for pricing, demo, or strategy, provide answer and append [TRIGGER_LEAD_FORM] at the very end.`,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Critical API Route Error:", error);
    return new Response(JSON.stringify({ error: "Failed to connect to AI" }), { status: 500 });
  }
}
