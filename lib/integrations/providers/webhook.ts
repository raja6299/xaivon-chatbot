import { IntegrationProvider, IntegrationResult } from '../types';
import { executeWebhook } from '../engine';

export class WebhookProvider implements IntegrationProvider {
  id = 'webhook';
  name = 'Generic Webhook';
  type = 'webhook' as const;

  async execute(payload: Record<string, unknown>): Promise<IntegrationResult> {
    if (!payload.url || typeof payload.url !== 'string') {
      throw new Error('Webhook URL is required in payload');
    }

    const data = await executeWebhook({
      url: payload.url,
      method: (payload.method as 'GET' | 'POST' | 'PUT' | 'DELETE') || 'POST',
      headers: payload.headers as Record<string, string>,
      secret: payload.secret as string | undefined
    }, payload.data as Record<string, unknown> || payload);

    return {
      success: true,
      providerId: this.id,
      jobId: '', // Set by engine later
      durationMs: 0,
      response: data
    };
  }
}
