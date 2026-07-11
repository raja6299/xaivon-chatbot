import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { knowledgeBase } from '@/lib/knowledge-base';

export async function POST(req: Request) {
  try {
    console.log('[CHAT API] Request received');

    // Verify API key exists in environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('[CHAT API] ERROR: OPENAI_API_KEY is missing from environment variables');
      return new Response(
        JSON.stringify({ error: 'API key not configured. Please contact support.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] OPENAI_API_KEY verified, length:', process.env.OPENAI_API_KEY.length);

    // Parse incoming request
    const { messages } = await req.json();

    // Validate messages format
    if (!messages || !Array.isArray(messages)) {
      console.error('[CHAT API] ERROR: Invalid messages format received');
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] Valid messages received, count:', messages.length);

    // Build system prompt with knowledge base
    const systemPrompt = `${knowledgeBase.systemPrompt}\n\nCurrent services and pricing:\n${JSON.stringify(knowledgeBase.services, null, 2)}`;

    console.log('[CHAT API] Initializing OpenAI connection with gpt-4o-mini model');

    // ✅ FIX #1: Pass apiKey explicitly via createOpenAI provider
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // ✅ FIX #2: Await the streamText() promise
    const response = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
    });

    console.log('[CHAT API] OpenAI stream initialized successfully, preparing response');

    // ✅ FIX #3: Use toUIMessageStreamResponse (required by frontend's DefaultChatTransport)
    return response.toUIMessageStreamResponse();

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[CHAT API] FATAL ERROR caught in catch block');
    console.error('[CHAT API] Error message:', err.message);
    console.error('[CHAT API] Stack trace:', err.stack?.substring(0, 500) || 'No stack');

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: err.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}