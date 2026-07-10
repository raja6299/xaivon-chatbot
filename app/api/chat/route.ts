import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { knowledgeBase } from '@/lib/knowledge-base';



export async function POST(req: Request) {
  try {
    // DEBUG: Log that we're in the route
    console.log('[CHAT API] Request received');

    // DEBUG: Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      console.error('[CHAT API] ERROR: OPENAI_API_KEY is missing from environment');
      return new Response(
        JSON.stringify({
          error: 'API key not configured. Contact support.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] OPENAI_API_KEY is present, length:', process.env.OPENAI_API_KEY.length);

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('[CHAT API] ERROR: Invalid messages format');
      return new Response(
        JSON.stringify({ error: 'Messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] Messages received:', messages.length);

    const systemPrompt = `${knowledgeBase.systemPrompt}

Current services and pricing:
${JSON.stringify(knowledgeBase.services, null, 2)}`;

    console.log('[CHAT API] Calling OpenAI with model: gpt-4o-mini');

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
    });

    console.log('[CHAT API] OpenAI call successful, streaming response');
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('[CHAT API] FATAL ERROR:', error instanceof Error ? error.message : error);
    console.error('[CHAT API] Full error stack:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}