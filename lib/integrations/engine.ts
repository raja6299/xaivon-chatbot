import { JobConfig, IntegrationResult, WebhookConfig } from './types';

// In-memory queue for demonstration (use Redis/SQS for production)
const jobQueue: Map<string, JobConfig> = new Map();
const jobResults: Map<string, IntegrationResult> = new Map();

/**
 * Execute a job asynchronously in the background.
 * Uses fire-and-forget to avoid blocking the streaming response.
 */
export function enqueueJob(
  job: JobConfig,
  executeFn: (payload: Record<string, unknown>) => Promise<unknown>
): string {
  jobQueue.set(job.id, job);

  // Run in background without awaiting
  if (typeof setImmediate !== 'undefined') {
    setImmediate(() => processJob(job, executeFn));
  } else {
    setTimeout(() => processJob(job, executeFn), 0);
  }

  return job.id;
}

/**
 * Process a job with exponential backoff retry logic.
 */
async function processJob(
  job: JobConfig,
  executeFn: (payload: Record<string, unknown>) => Promise<unknown>,
  attempt = 1
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Add timeout handling
    const result = await Promise.race([
      executeFn(job.payload),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Job timeout')), job.timeoutMs)
      )
    ]);

    const duration = Date.now() - startTime;
    jobResults.set(job.id, {
      success: true,
      providerId: job.providerId,
      jobId: job.id,
      durationMs: duration,
      response: result,
      retries: attempt - 1
    });
    
    jobQueue.delete(job.id);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const isNetworkError = error instanceof Error && (
      error.message.includes('timeout') || 
      error.message.includes('fetch') || 
      error.message.includes('network')
    );

    // Only retry safe failures (e.g. network/timeouts, not 400 Bad Request)
    if (attempt <= job.maxRetries && isNetworkError) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000); // 2s, 4s, 8s, max 10s
      setTimeout(() => processJob(job, executeFn, attempt + 1), backoffMs);
    } else {
      jobResults.set(job.id, {
        success: false,
        providerId: job.providerId,
        jobId: job.id,
        durationMs: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        retries: attempt - 1
      });
      jobQueue.delete(job.id);
    }
  }
}

/**
 * Reusable Webhook Engine
 */
export async function executeWebhook(config: WebhookConfig, payload: Record<string, unknown>) {
  // Validate and sanitize URL to prevent SSRF
  try {
    const url = new URL(config.url);
    if (['localhost', '127.0.0.1', '169.254.169.254'].includes(url.hostname)) {
      throw new Error('Blocked internal IP request (SSRF prevention)');
    }
  } catch {
    throw new Error('Invalid webhook URL');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'XAIVON-Integration-Engine/1.0',
    ...(config.headers || {})
  };

  if (config.secret) {
    // Simple signature header (in prod use HMAC SHA256)
    headers['X-Xaivon-Signature'] = config.secret; 
  }

  const response = await fetch(config.url, {
    method: config.method,
    headers,
    body: config.method !== 'GET' ? JSON.stringify(payload) : undefined,
    // Note: Next.js fetch doesn't use standard timeout options easily, but our job queue handles Promise.race timeouts
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { data: text };
  }
}

export function getJobResult(jobId: string): IntegrationResult | undefined {
  return jobResults.get(jobId);
}

export function getAllJobResults(): IntegrationResult[] {
  return Array.from(jobResults.values()).sort((a, b) => b.durationMs - a.durationMs);
}
