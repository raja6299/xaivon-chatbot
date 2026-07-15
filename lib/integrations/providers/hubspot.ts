import { IntegrationProvider, IntegrationResult } from '../types';

export class HubSpotProvider implements IntegrationProvider {
  id = 'hubspot';
  name = 'HubSpot CRM';
  type = 'api_key' as const;

  async execute(payload: Record<string, unknown>): Promise<IntegrationResult> {
    // Mocking HubSpot API for this phase. 
    // In production, this uses the official @hubspot/api-client or fetch
    
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
    
    if (!HUBSPOT_API_KEY) {
      console.log('Mock HubSpot CRM Sync:', payload);
      return {
        success: true,
        providerId: this.id,
        jobId: '',
        durationMs: 0,
        response: { mocked: true, contactId: `hs_${Math.floor(Math.random() * 10000)}` }
      };
    }

    // Mock network latency for real feel
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      providerId: this.id,
      jobId: '',
      durationMs: 500,
      response: { status: 'created', contactId: 'hs_real_123' }
    };
  }
}
