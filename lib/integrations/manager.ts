import { v4 as uuidv4 } from 'uuid';
import { IntegrationProvider } from './types';
import { enqueueJob } from './engine';
import { WebhookProvider } from './providers/webhook';
import { SlackProvider } from './providers/slack';
import { HubSpotProvider } from './providers/hubspot';

export class IntegrationManager {
  private providers: Map<string, IntegrationProvider> = new Map();

  constructor() {
    this.registerProvider(new WebhookProvider());
    this.registerProvider(new SlackProvider());
    this.registerProvider(new HubSpotProvider());
  }

  registerProvider(provider: IntegrationProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): IntegrationProvider | undefined {
    return this.providers.get(id);
  }

  getAvailableProviders() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type
    }));
  }

  /**
   * Triggers an integration asynchronously.
   * Does NOT block the thread waiting for the integration to complete.
   */
  trigger(providerId: string, payload: Record<string, unknown>): string {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Integration provider '${providerId}' not found.`);
    }

    const jobId = uuidv4();
    
    enqueueJob({
      id: jobId,
      providerId,
      payload,
      maxRetries: 3,
      timeoutMs: 15000,
    }, (data) => provider.execute(data));

    return jobId;
  }
}

// Singleton instance
export const integrations = new IntegrationManager();
