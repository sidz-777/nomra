import { NotificationPayload, ProviderDispatchResult, NotificationProviderAdapter } from '../types';
import { renderNotificationTemplate } from '../templates';
import { maskEmail } from '../masking';

export class MockEmailAdapter implements NotificationProviderAdapter {
  public readonly name = 'mock' as const;
  public readonly channel = 'email' as const;

  async send(payload: NotificationPayload): Promise<ProviderDispatchResult> {
    const rendered = renderNotificationTemplate(payload.type, payload);
    const masked = maskEmail(payload.email || `${payload.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`);

    // Simulated reliable mock dispatch (Phase 4 mock-only mode)
    const simulatedMsgId = `mock_email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Notification MOCK EMAIL] To: ${masked} | Subject: "${rendered.subject}" | ID: ${simulatedMsgId}`);
    }

    return {
      success: true,
      providerMessageId: simulatedMsgId,
    };
  }
}
