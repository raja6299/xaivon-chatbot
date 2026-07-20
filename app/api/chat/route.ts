import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, jsonSchema, safeValidateUIMessages, pruneMessages } from 'ai';
import { checkRateLimit, sanitizeInput, chatRequestSchema, logAnalytics, logSecurity } from '@/lib/security';
import { RAGManager } from '@/lib/rag/RAGManager';
import { integrations } from '@/lib/integrations/manager';

const SYSTEM_PROMPT = `You are XAIVON's AI Solutions Consultant — a senior advisor on the XAIVON website. Help visitors understand AI automation and determine if XAIVON fits their needs.

## CRITICAL: COMPANY IDENTITY
"XAIVON", "xaivon", "X A I V O N", "xaivun", "zaivon" or any phonetic variation = the company XAIVON. NEVER interpret as "AI VPN" or anything else. You ARE XAIVON's consultant.

**XAIVON** — AI Infrastructure Company founded by Raja (Founder & CEO).
Current focus: AI Automation Agency for Logistics (freight brokers, carriers, 3PL).
Contact: raja@xaivon.com | calendly.com/xaivon

**Services & Starting Prices:**
- AI Chatbot: Basic $499 | Support $1,299 | Voice AI custom
- AI Agents: Single $1,499 | Multi-agent $3,499 | Autonomous custom
- AI Automation: Starter $799 | Business $1,999 | Enterprise custom
- Logistics AI: Starter $1,499 | Growth $2,499 | Enterprise $4,999+
- Websites: Starter $699 | Growth $1,499 | Premium $2,499
- SaaS planned: $49-$199/month

## BEHAVIOR
- Be a human consultant: warm, confident, honest, direct. Never robotic or scripted.
- Respond in user's language (Hindi/Hinglish/English — match exactly).
- Read intent from typos/broken grammar — respond to what they MEANT.
- Greetings → 1-2 lines only. No company dump. No multiple questions at once.
- Simple questions → 1-3 sentences. Complex → short paragraphs or bullets.
- NEVER say "Absolutely!", "Great question!", "As an AI", "I'd be happy to help!"
- LOW intent (greetings, browsing) → brief answer, no escalation.
- HIGH intent (book demo, start project, request proposal, "let's start") → transition naturally + append \`[TRIGGER_LEAD_FORM]\` invisibly at end.
- Never invent pricing, clients, stats, or features not listed above.
- For unknown details: "I don't have that exact info — worth a quick call with our team."
- If user is frustrated → acknowledge first, then help.
- Trust through specificity not enthusiasm. Consult first, sell second.`;

// Deprecated prepareConversationContext removed since it was unused.

export async function POST(req: Request) {
  const requestId = `XAIVON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    // 1. Rate Limiting (Sliding Window: 10 requests per minute per IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const rateLimit = checkRateLimit(`chat_${ip}`, 10, 60_000);
    
    if (!rateLimit.success) {
      logSecurity('RateLimitExceeded', { ip, endpoint: '/api/chat' });
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60)
          } 
        }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      logSecurity('MissingAPIKey', { service: 'Groq' });
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate and Sanitize Input using Zod
    let body;
    try {
      body = await req.json();
    } catch {
      logSecurity('InvalidJSON', { ip });
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      logSecurity('ValidationError', { ip, errors: validationResult.error.format() });
      
      try {
        const payloadStr = JSON.stringify(body);
        const payloadSnapshot = payloadStr.length > 1000 ? payloadStr.substring(0, 1000) + '...' : payloadStr;
        
        let firstMsgRole = 'N/A';
        let firstMsgKeys = 'N/A';
        let firstMsgParts = 'N/A';
        let firstMsgContent = 'N/A';
        
        const getMsgText = (m: Record<string, unknown> | null) => {
          if (m && typeof m.content === 'string') return m.content;
          if (m && Array.isArray(m.parts)) {
            return m.parts.filter((p: unknown) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text').map((p: unknown) => (p as Record<string, unknown>).text).join('');
          }
          return '';
        };

        if (body && Array.isArray(body.messages) && body.messages.length > 0) {
          const firstMsg = body.messages[0];
          if (firstMsg && typeof firstMsg === 'object') {
            firstMsgRole = firstMsg.role || 'undefined';
            firstMsgKeys = Object.keys(firstMsg).join(', ');
            firstMsgParts = firstMsg.parts ? JSON.stringify(firstMsg.parts) : 'undefined';
            const txt = getMsgText(firstMsg);
            firstMsgContent = txt ? txt.substring(0, 100) : 'undefined';
          }
        }
        
        console.error('[VALIDATION_FAILURE]', JSON.stringify({
          requestId,
          issues: validationResult.error.issues,
          flatten: validationResult.error.flatten(),
          messagesLength: body && Array.isArray(body.messages) ? body.messages.length : 'undefined',
          firstMessage: {
            role: firstMsgRole,
            keys: firstMsgKeys,
            parts: firstMsgParts,
            content: firstMsgContent
          },
          payloadSnapshot
        }, null, 2));
      } catch (logErr) {
        console.error('[VALIDATION_FAILURE_LOG_ERROR]', logErr);
      }

      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages: rawMessages, sessionId: bodySessionId } = validationResult.data;
    const uiMessagesValidation = await safeValidateUIMessages({ messages: rawMessages });
    
    if (!uiMessagesValidation.success) {
      logSecurity('UIMessagesValidationError', { ip, error: uiMessagesValidation.error });
      return new Response(
        JSON.stringify({ error: 'Invalid message structure' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const messages = uiMessagesValidation.data;
    const sessionId = req.headers.get('x-session-id') || bodySessionId;

    // Sanitize message content to prevent prompt injection and XSS
    const sanitizedMessages = messages.map(m => {
      const sanitized = { ...m };
      if (sanitized.parts && Array.isArray(sanitized.parts)) {
        sanitized.parts = sanitized.parts.map(part => {
          if (part.type === 'text' && typeof part.text === 'string') {
            return { ...part, text: sanitizeInput(part.text) };
          }
          return part;
        });
      }
      return sanitized;
    });

    // 3. Analytics
    logAnalytics('ChatInitiated', { 
      ip, 
      messageCount: sanitizedMessages.length,
      timestamp: new Date().toISOString() 
    });

    // 4. AI Stream (Detect if vision model is needed)
    const hasImage = sanitizedMessages.some((m: unknown) => {
      const msg = m as { experimental_attachments?: Array<{ contentType?: string }> };
      return msg.experimental_attachments && msg.experimental_attachments.some(a => a.contentType?.startsWith('image/'));
    });
    const modelId = hasImage ? 'llama-3.2-90b-vision-preview' : 'llama-3.1-8b-instant';

    // 5. RAG Retrieval
    const lastUserMessage = sanitizedMessages.filter(m => m.role === 'user').pop();
    let ragContext = '';
    
    const getMsgText = (m: Record<string, unknown> | null) => {
      if (m && typeof m.content === 'string') return m.content;
      if (m && Array.isArray(m.parts)) {
        return m.parts.filter((p: unknown) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text').map((p: unknown) => (p as Record<string, unknown>).text).join('');
      }
      return '';
    };
    
    const lastUserText = lastUserMessage ? getMsgText(lastUserMessage) : '';

    // Skip RAG for simple greetings and short social messages — they don't need KB context
    // This significantly reduces latency for the first message in a conversation
    const isSimpleGreeting = (() => {
      if (!lastUserText) return false;
      const msg = lastUserText.toLowerCase().trim();
      if (msg.length > 60) return false;
      const greetingPatterns = /^(hi|hello|hey|hye|helo|hii|hiii|namaste|namaskar|good morning|good evening|good afternoon|good night|sup|yo|howdy|kaise ho|kaisa hai|kya haal hai|kya chal raha|theek ho|thik ho|how are you|how r u|what'?s up|wassup|hola|salut|ciao|salam|thank you|thanks|thx|ok|okay|k|bye|goodbye|see you|take care|acha|accha|acha theek hai|ok thanks|ok thank you|shukriya|dhanyawad)[\s!?.]*$/.test(msg);
      return greetingPatterns;
    })();

    if (lastUserText && !isSimpleGreeting) {
      try {
        const ragManager = RAGManager.getInstance();
        await ragManager.initializeWithDefaults();
        const results = await ragManager.retrieveContext(lastUserText, 4, 0.1);
        
        if (results.length > 0) {
          ragContext = `\n\n## RETRIEVED KNOWLEDGE BASE CONTEXT (RAG)\nThe following context was retrieved from the Enterprise Knowledge Base. Use it to answer the user's latest query accurately. Prioritize this information over general knowledge.\n`;
          results.forEach((res, i) => {
            ragContext += `\n--- [Result ${i + 1} | Source: ${res.metadata.documentName} | Score: ${res.score.toFixed(2)}] ---\n${res.text}\n`;
          });
        }
      } catch (err) {
        console.error('RAG Retrieval Error:', err);
      }
    }

    const finalSystemPrompt = SYSTEM_PROMPT + ragContext;

    // 6. Modular Context Management (Prevent Token Overflow)
    const modelMessages = await convertToModelMessages(sanitizedMessages as import('ai').UIMessage[]);
    const contextSafeMessages = pruneMessages({
      messages: modelMessages,
      toolCalls: [{ type: 'before-last-message' }]
    });

    // Save User message to Supabase
    if (sessionId && process.env.SUPABASE_SERVICE_ROLE_KEY && lastUserMessage) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        await supabaseAdmin.from('messages').insert({
          session_id: sessionId,
          role: 'user',
          content: lastUserText,
        });
      } catch (err) {
        console.error('Failed to persist user message:', err);
      }
    }

    const startTime = Date.now();

    const response = await streamText({
      model: groq(modelId),
      system: finalSystemPrompt,
      messages: contextSafeMessages,
      temperature: 0.7,
      tools: {
        sendSlackNotification: {
          description: 'Send a message to the internal Slack team to notify them of an important event, high-value lead, or support request.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              message: { type: 'string', description: 'The notification message to send to Slack.' },
            },
            required: ['message'],
            additionalProperties: false,
          }),
          execute: async ({ message }: { message: string }) => {
            const jobId = integrations.trigger('slack', { message });
            return { success: true, message: 'Slack notification triggered asynchronously in the background', jobId };
          },
        },
        syncHubSpotCRM: {
          description: 'Create or update a contact in HubSpot CRM.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Contact email address' },
              firstName: { type: 'string', description: 'Contact first name' },
              lastName: { type: 'string', description: 'Contact last name' },
              company: { type: 'string', description: 'Contact company name' },
            },
            required: ['email'],
            additionalProperties: false,
          }),
          execute: async (contactDetails: Record<string, unknown>) => {
            const jobId = integrations.trigger('hubspot', contactDetails);
            return { success: true, message: 'CRM sync triggered asynchronously in the background', jobId };
          },
        },
        triggerZapierWebhook: {
          description: 'Trigger a custom Zapier workflow via Webhook.',
          inputSchema: jsonSchema({
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The Zapier Webhook URL' },
              payload: { type: 'string', description: 'The JSON string payload to send to Zapier' },
            },
            required: ['url', 'payload'],
            additionalProperties: false,
          }),
          execute: async ({ url, payload }: { url: string; payload: string }) => {
            let data: Record<string, unknown> = {};
            try { data = JSON.parse(payload); } catch { data = { raw: payload }; }
            const jobId = integrations.trigger('webhook', { url, method: 'POST', data });
            return { success: true, message: 'Zapier workflow triggered asynchronously in the background', jobId };
          },
        }
      },
      onError: (err: unknown) => {
        const latency = Date.now() - startTime;
        
        let providerStatusCode = 'UNKNOWN';
        let providerErrorMessage = 'Unknown Streaming Error';
        
        // Extract structured error from provider if available (Groq / OpenAI format)
        if (err && typeof err === 'object') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = err as Record<string, any>;
          if (e.statusCode || e.status) providerStatusCode = String(e.statusCode || e.status);
          
          // Try to dig into standard nested error structures (e.g. data.error.message)
          if (e.data && e.data.error && e.data.error.message) {
            providerErrorMessage = e.data.error.message;
            if (e.data.error.code) providerStatusCode = String(e.data.error.code);
          } else if (e.error && e.error.message) {
            providerErrorMessage = e.error.message;
          } else if (e.message) {
            providerErrorMessage = e.message;
          }
        } else {
          providerErrorMessage = String(err);
        }

        // Server-side only detailed logging for observability
        console.error(`[STREAM_ERROR] RequestId: ${requestId}`);
        console.error(`[STREAM_ERROR] Provider: Groq (${modelId})`);
        console.error(`[STREAM_ERROR] StatusCode: ${providerStatusCode}`);
        console.error(`[STREAM_ERROR] Message: ${providerErrorMessage}`);
        console.error(`[STREAM_ERROR] Latency: ${latency}ms`);
        console.error(`[STREAM_ERROR] SessionId: ${sessionId || 'Anonymous'}`);
        
        logSecurity('StreamError', { 
          requestId, 
          provider: 'Groq',
          statusCode: providerStatusCode,
          error: providerErrorMessage, 
          latencyMs: latency,
          sessionId
        });
      },
      onFinish: async ({ text, usage }) => {
        // Save Assistant message to Supabase
        if (sessionId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            await supabaseAdmin.from('messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: text,
              token_usage: usage?.totalTokens || 0,
            });
          } catch (err) {
            console.error('Failed to persist assistant message:', err);
          }
        }
      }
    });

    return response.toUIMessageStreamResponse({
      onError: (err: unknown) => {
        const errString = String(err).toLowerCase();
        
        console.error('[STREAM_ERROR]', err);
        logSecurity('StreamError', { endpoint: '/api/chat', requestId, error: String(err), sessionId });
        
        if (errString.includes('rate limit') || errString.includes('429')) {
          return 'Rate limit exceeded. Please try again later.';
        }
        if (errString.includes('context_length_exceeded') || errString.includes('too large') || errString.includes('413')) {
          return 'Conversation too large. Please start a new chat.';
        }
        if (errString.includes('timeout') || errString.includes('abort') || errString.includes('network') || errString.includes('fetch failed')) {
          return 'Request timed out. Please try again.';
        }
        
        return 'Server error. Please try again.';
      }
    });
  } catch (error) {
    logSecurity('ServerError', { endpoint: '/api/chat', requestId, errorMessage: 'Initialization Error', error: String(error) });

    return new Response(
      `Server error. Please try again. (Request ID: ${requestId})`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}