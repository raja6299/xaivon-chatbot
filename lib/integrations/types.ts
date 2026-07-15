export interface IntegrationProvider {
  id: string;
  name: string;
  type: 'webhook' | 'oauth' | 'api_key';
  execute(payload: Record<string, unknown>): Promise<IntegrationResult>;
}

export interface IntegrationResult {
  success: boolean;
  providerId: string;
  jobId: string;
  durationMs: number;
  response?: unknown;
  error?: string;
  retries?: number;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  secret?: string;
}

export interface JobConfig {
  id: string;
  providerId: string;
  payload: Record<string, unknown>;
  maxRetries: number;
  timeoutMs: number;
}
