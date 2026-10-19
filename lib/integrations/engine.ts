import { JobConfig, IntegrationResult, WebhookConfig } from './types';

// In-memory record for observability
const jobResults: Map<string, IntegrationResult> = new Map();

// Strict list of allowed external webhook hostnames (server-controlled)
const ALLOWED_WEBHOOK_HOSTS = new Set([
  'hooks.zapier.com',
  'hooks.slack.com',
  'api.hubspot.com',
  'maker.ifttt.com'
]);

/**
 * Checks whether an IP or hostname is private or reserved (SSRF protection).
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().trim();

  // Localhost & internal domain names
  if (
    normalized === 'localhost' ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized.endsWith('.localhost')
  ) {
    return true;
  }

  // IPv4 checks
  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [b0, b1] = [parseInt(ipv4Match[1], 10), parseInt(ipv4Match[2], 10)];
    if (b0 === 0) return true; // 0.0.0.0/8
    if (b0 === 10) return true; // 10.0.0.0/8
    if (b0 === 127) return true; // 127.0.0.0/8 Loopback
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 Link-local / AWS/GCP metadata
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
    if (b0 >= 224) return true; // 224.0.0.0/4 Multicast / reserved
  }

  // IPv6 loopback / link-local / unique local
  if (
    normalized === '::1' ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd')
  ) {
    return true;
  }

  return false;
}

/**
 * Strict server-side webhook destination validator
 */
export function validateWebhookDestination(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid webhook URL format');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Insecure protocol. Webhooks must strictly use HTTPS.');
  }

  if (isPrivateOrReservedHost(url.hostname)) {
    throw new Error('Access to private or internal network addresses is forbidden.');
  }

  // Verify against server-controlled domain allowlist if configured
  if (!ALLOWED_WEBHOOK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Destination host '${url.hostname}' is not in the approved integration allowlist.`);
  }

  return url;
}

/**
 * Safe, synchronous webhook execution with bounded timeout and redirect protection
 */
export async function executeWebhook(config: WebhookConfig, payload: Record<string, unknown>) {
  const verifiedUrl = validateWebhookDestination(config.url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max timeout

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'XAIVON-Integration-Engine/2.0',
    ...(config.headers || {})
  };

  if (config.secret) {
    headers['X-Xaivon-Signature'] = config.secret;
  }

  try {
    const response = await fetch(verifiedUrl.toString(), {
      method: config.method,
      headers,
      body: config.method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
      redirect: 'manual' // Prevent SSRF via open redirects
    });

    clearTimeout(timeoutId);

    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      throw new Error('Webhook redirects are disallowed for security reasons.');
    }

    if (!response.ok) {
      throw new Error(`Integration endpoint returned HTTP ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { data: text };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Synchronous execution for durable side effects
 */
export async function executeIntegrationJob(
  job: JobConfig,
  executeFn: (payload: Record<string, unknown>) => Promise<unknown>
): Promise<IntegrationResult> {
  const startTime = Date.now();
  try {
    const result = await Promise.race([
      executeFn(job.payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), job.timeoutMs || 10000)
      )
    ]);

    const duration = Date.now() - startTime;
    const res: IntegrationResult = {
      success: true,
      providerId: job.providerId,
      jobId: job.id,
      durationMs: duration,
      response: result,
      retries: 0
    };
    jobResults.set(job.id, res);
    return res;
  } catch (err) {
    const duration = Date.now() - startTime;
    const res: IntegrationResult = {
      success: false,
      providerId: job.providerId,
      jobId: job.id,
      durationMs: duration,
      error: err instanceof Error ? err.message : 'Unknown integration error',
      retries: 0
    };
    jobResults.set(job.id, res);
    return res;
  }
}

export function enqueueJob(
  job: JobConfig,
  executeFn: (payload: Record<string, unknown>) => Promise<unknown>
): string {
  // Execute safely without crashing the event loop or claiming unverified completion
  executeIntegrationJob(job, executeFn).catch((err) => {
    console.warn(`[IntegrationJob] Failed for ${job.providerId}:`, err);
  });
  return job.id;
}

export function getJobResult(jobId: string): IntegrationResult | undefined {
  return jobResults.get(jobId);
}

export function getAllJobResults(): IntegrationResult[] {
  return Array.from(jobResults.values()).sort((a, b) => b.durationMs - a.durationMs);
}
