import { NotificationPayload, ProviderDispatchResult, NotificationProviderAdapter } from '../types';
import { renderNotificationTemplate } from '../templates';
import { maskPhoneNumber } from '../masking';

export class MockWhatsAppAdapter implements NotificationProviderAdapter {
  public readonly name = 'mock' as const;
  public readonly channel = 'whatsapp' as const;

  async send(payload: NotificationPayload): Promise<ProviderDispatchResult> {
    const rendered = renderNotificationTemplate(payload.type, payload);
    const masked = maskPhoneNumber(payload.phone);

    // Simulated reliable mock dispatch (Phase 4 mock-only mode)
    const simulatedMsgId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Notification MOCK WHATSAPP] To: ${masked} | Message: "${rendered.body.substring(0, 60)}..." | ID: ${simulatedMsgId}`);
    }

    return {
      success: true,
      providerMessageId: simulatedMsgId,
    };
  }
}
