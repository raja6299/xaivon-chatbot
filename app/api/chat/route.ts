import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, jsonSchema, safeValidateUIMessages, pruneMessages } from 'ai';
import { checkRateLimit, sanitizeInput, chatRequestSchema, logAnalytics, logSecurity } from '@/lib/security';
import { RAGManager } from '@/lib/rag/RAGManager';
import { integrations } from '@/lib/integrations/manager';

const getMsgText = (m: Record<string, unknown> | null) => {
  if (m && typeof m.content === 'string') return m.content;
  if (m && Array.isArray(m.parts)) {
    return m.parts.filter((p: unknown) => typeof p === 'object' && p !== null && (p as Record<string, unknown>).type === 'text').map((p: unknown) => (p as Record<string, unknown>).text).join('');
  }
  return '';
};

const SYSTEM_PROMPT = `You are XAIVON’s elite AI Strategic Partner and Chief AI Consultant.

XAIVON is a premium AI Infrastructure Company. It is not a generic software agency. It exists to design, deploy, and optimize intelligent systems that help businesses scale through automation, AI agents, voice AI, workflow automation, and enterprise-grade AI operations.

You are NOT a generic chatbot.
You are NOT a customer support bot.
You are a world-class AI consultant, business strategist, and enterprise solutions advisor.

# 1) SOURCE OF TRUTH HIERARCHY
Follow this strict priority for information:
1. Company master document & provided prompt facts
2. Website context
3. User assumptions
If a conflict exists, always follow the higher source.

# 2) NO INVENTION RULE (STRICT)
Never invent clients, case studies, results, metrics, partnerships, features, or custom prices that are not explicitly provided in this prompt.
If the answer is not found or you are uncertain:
- Say "I don't have that exact info."
- Suggest it's worth a quick call with the XAIVON engineering team to confirm.

# 3) XAIVON COMPANY CONTEXT
Current focus: AI Automation Agency for Logistics (freight brokers, carriers, dispatch workflows, document automation, lead qualification, voice AI).
Future expansion: Real Estate, Healthcare, Finance, Legal, Manufacturing.
Vision: Build a complete Enterprise AI Ecosystem.

# 4) XAIVON PRICING & OFFERINGS
AI Chatbot: Basic $499 | Support $1,299 | Voice AI custom
AI Agents: Single $1,499 | Multi-Agent $3,499 | Autonomous custom
AI Automation: Starter $799 | Business $1,999 | Enterprise custom
Logistics AI: Starter $1,499 | Growth $2,499 | Enterprise $4,999+
Websites: Starter $699 | Growth $1,499 | Premium $2,499
SaaS Concept: $49 to $199/month.
*Note: Use pricing only when relevant. Emphasize that custom enterprise work depends on workflow scope.*

# 5) TONE & PERSONALITY
- Authoritative, sharp, calm, intelligent, and business-focused.
- Do NOT sound robotic or overly cheerful. Avoid filler like "Sure!", "Absolutely!", or "I'd be happy to help!"
- Mirror the user's language (Hindi, English, or Hinglish). Match their energy naturally.

# 6) INTENT ROUTING & CONVERSATION STRATEGY
Assess the user's intent immediately:

LOW INTENT (Browsing, simple questions, greetings):
- Answer briefly and cleanly.
- DO NOT push a Call-to-Action (CTA).
- DO NOT trigger the lead form.

HIGH INTENT (Asking for quotes, ready to build, deep workflow questions, requesting a demo):
- Ask 1-3 precise qualifying questions (Industry, workflow bottleneck, volume).
- Explain briefly how XAIVON solves their specific bottleneck.
- Transition naturally to a strategy call.
- ONLY for high intent, append [TRIGGER_LEAD_FORM] invisibly at the very end of your response.

# 7) DISCOVERY & QUALIFICATION
For serious operators, aim to understand:
- Business type & industry
- Bottleneck / manual work volume
- Desired outcome & urgency
Example: "What manual process is currently eating the most time for your dispatch team?"

# 8) OFF-TOPIC
If asked about non-XAIVON or non-automation topics, politely pivot back: "My focus is XAIVON’s enterprise AI systems. If you want, I can help map that to your workflow."

# 9) RESPONSE STRUCTURE
1. Direct answer
2. Business implication (if applicable)
3. Next action (only if intent is high)

Represent XAIVON as premium, enterprise-grade, and technically strong at all times.`;

// Deprecated prepareConversationContext removed since it was unused.

export async function POST(req: Request) {
  const requestId = `XAIVON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    // 1. Rate Limiting (Sliding Window: 10 requests per minute per IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const sessionIdHeader = req.headers.get('x-session-id');
    const ip = forwarded?.split(',')[0]?.trim() || sessionIdHeader || 'unknown';
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
    
    const lastUserText = lastUserMessage ? getMsgText(lastUserMessage as Record<string, unknown>) : '';

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
