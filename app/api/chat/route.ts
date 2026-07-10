import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { knowledgeBase } from '@/lib/knowledge-base';

// Edge runtime - only expose OPENAI_API_KEY (no secrets on edge)
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

    // Convert incoming UIMessages (with parts) to ModelMessages for streamText
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: knowledgeBase.systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    // AI SDK v7 UI message stream protocol (replaces deprecated toDataStreamResponse)
    return result.toUIMessageStreamResponse();

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