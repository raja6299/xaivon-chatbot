import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { knowledgeBase } from '@/lib/knowledge-base';

export const runtime = 'edge';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use system prompt from knowledge-base.json
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: knowledgeBase.systemPrompt,
      messages,
    });

    // Return streaming response (IMPORTANT: do NOT wrap in manual Response)
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}