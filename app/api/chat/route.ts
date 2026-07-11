import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import { knowledgeBase } from '@/lib/knowledge-base';

export async function POST(req: Request) {
  try {
    console.log('[CHAT API] Request received');

    if (!process.env.OPENAI_API_KEY) {
      console.error('[CHAT API] ERROR: OPENAI_API_KEY missing');
      return new Response(
        JSON.stringify({ error: 'API key not configured. Contact support.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] API key verified, length:', process.env.OPENAI_API_KEY.length);

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('[CHAT API] ERROR: Invalid messages format');
      return new Response(
        JSON.stringify({ error: 'Messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CHAT API] Messages count:', messages.length);

    const systemPrompt = `${knowledgeBase.systemPrompt}\n\nCurrent services and pricing:\n${JSON.stringify(knowledgeBase.services, null, 2)}`;

    console.log('[CHAT API] Calling OpenAI gpt-4o-mini');

    // createOpenAI accepts apiKey; openai() default export does not
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      temperature: 0.7,
    });

    console.log('[CHAT API] Stream ready, sending response');

    return response.toUIMessageStreamResponse();

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[CHAT API] FATAL ERROR:', err.message);
    console.error('[CHAT API] Stack:', err.stack?.substring(0, 300));

    return new Response(
      JSON.stringify({
        error: 'Chat request failed',
        message: err.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}