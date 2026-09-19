import { NotificationPayload, ProviderDispatchResult, NotificationProviderAdapter, NotificationChannel } from '../types';

export type { NotificationProviderAdapter };

export class AdapterRegistry {
  private static adapters = new Map<string, NotificationProviderAdapter>();

  public static register(adapter: NotificationProviderAdapter): void {
    const key = `${adapter.channel}:${adapter.name}`;
    this.adapters.set(key, adapter);
  }

  public static get(channel: NotificationChannel, provider: string = 'mock'): NotificationProviderAdapter | undefined {
    return this.adapters.get(`${channel}:${provider}`) || this.adapters.get(`${channel}:mock`);
  }
}
