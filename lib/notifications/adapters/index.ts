import { AdapterRegistry } from './base';
import { MockEmailAdapter } from './email-adapter';
import { MockWhatsAppAdapter } from './whatsapp-adapter';
import { MockSmsAdapter } from './sms-adapter';

// Auto-register default mock adapters
AdapterRegistry.register(new MockEmailAdapter());
AdapterRegistry.register(new MockWhatsAppAdapter());
AdapterRegistry.register(new MockSmsAdapter());

export { AdapterRegistry, MockEmailAdapter, MockWhatsAppAdapter, MockSmsAdapter };
