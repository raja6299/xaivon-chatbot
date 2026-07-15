import { IntegrationProvider, IntegrationResult } from '../types';
import { executeWebhook } from '../engine';

export class SlackProvider implements IntegrationProvider {
  id = 'slack';
  name = 'Slack';
  type = 'webhook' as const; // using incoming webhooks

  async execute(payload: Record<string, unknown>): Promise<IntegrationResult> {
    // In production, this would be fetched from DB
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    
    if (!SLACK_WEBHOOK_URL) {
      // Mock success if no webhook URL is configured to prevent breaking chat
      console.log('Mock Slack Notification Sent:', payload.message);
      return {
        success: true,
        providerId: this.id,
        jobId: '',
        durationMs: 0,
        response: { mocked: true, status: 'sent' }
      };
    }

    const data = await executeWebhook({
      url: SLACK_WEBHOOK_URL,
      method: 'POST',
    }, { text: payload.message || JSON.stringify(payload) });

    return {
      success: true,
      providerId: this.id,
      jobId: '',
      durationMs: 0,
      response: data
    };
  }
}
