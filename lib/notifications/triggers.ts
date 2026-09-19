/**
 * Server-authoritative notification trigger helpers.
 * Fully decoupled and non-blocking: never fails the calling transaction or endpoint.
 */

import { NotificationService } from './service';
import { NotificationType } from './types';

export async function triggerOrderConfirmed(order: any): Promise<void> {
  try {
    if (!order || !order.id) return;
    await NotificationService.enqueue(order, 'order_confirmed', ['whatsapp', 'email']);
  } catch (err: any) {
    console.error('[Notification Trigger] Failed to trigger order_confirmed:', err?.message);
  }
}

export async function triggerPaymentConfirmed(order: any): Promise<void> {
  try {
    if (!order || !order.id) return;
    await NotificationService.enqueue(order, 'payment_confirmed', ['whatsapp', 'email']);
  } catch (err: any) {
    console.error('[Notification Trigger] Failed to trigger payment_confirmed:', err?.message);
  }
}

export async function triggerOrderStatusTransition(order: any, newStatus: string): Promise<void> {
  try {
    if (!order || !order.id || !newStatus) return;

    const statusMap: Record<string, NotificationType> = {
      processing: 'order_processing',
      personalization_review: 'personalization_review',
      ready_to_ship: 'ready_to_ship',
      shipped: 'shipped',
      dispatched: 'shipped',
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled',
      returned: 'returned',
    };

    const notifType = statusMap[newStatus.toLowerCase().trim()];
    if (notifType) {
      await NotificationService.enqueue(order, notifType, ['whatsapp', 'email']);
    }
  } catch (err: any) {
    console.error(`[Notification Trigger] Failed to trigger status transition (${newStatus}):`, err?.message);
  }
}

export async function triggerShippingNotification(order: any, shippingData: {
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
}): Promise<void> {
  try {
    if (!order || !order.id) return;
    const enrichedOrder = {
      ...order,
      carrier: shippingData.carrier || order.carrier || order.courier_name,
      tracking_number: shippingData.tracking_number || order.tracking_number,
      tracking_url: shippingData.tracking_url || order.tracking_url,
    };
    await NotificationService.enqueue(enrichedOrder, 'shipped', ['whatsapp', 'sms']);
  } catch (err: any) {
    console.error('[Notification Trigger] Failed to trigger shipping notification:', err?.message);
  }
}
