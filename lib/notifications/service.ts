/**
 * NAMORA Durable Notification Service
 * Log-first architecture, atomic lease claiming, stale-lease recovery, and mock-only provider execution.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import {
  NotificationChannel,
  NotificationLog,
  NotificationPayload,
  NotificationType,
  ProviderDispatchResult,
} from './types';
import { AdapterRegistry } from './adapters';
import { maskEmail, maskPhoneNumber } from './masking';

// In-memory fallback ledger strictly restricted to explicit non-production test harnesses
const fallbackLogs = new Map<string, NotificationLog>();

export class NotificationService {
  /**
   * Evaluates whether in-memory fallback is explicitly allowed.
   * In production (NODE_ENV === 'production'), in-memory fallback is STRICTLY and UNCONDITIONALLY DISABLED.
   * In non-production environments, fallback is ONLY permitted if ALLOW_DEV_NOTIFICATION_FALLBACK is explicitly set to 'true'.
   */
  public static isFallbackAllowed(): boolean {
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return process.env.ALLOW_DEV_NOTIFICATION_FALLBACK === 'true';
  }

  /**
   * Deterministic idempotency key: `${order_id}_${notification_type}_${channel}`
   */
  public static buildIdempotencyKey(
    orderId: string,
    type: NotificationType,
    channel: NotificationChannel
  ): string {
    return `${orderId}_${type}_${channel}`;
  }

  /**
   * Enqueues durable notification log records for specified channels.
   * Completely decoupled and safe from order/payment mutation failures.
   */
  public static async enqueue(
    order: {
      id: string;
      order_number: string;
      customer_name?: string;
      phone?: string;
      email?: string;
      carrier?: string;
      tracking_number?: string;
      tracking_url?: string;
      deposit_amount?: number;
      cod_amount?: number;
      total_amount?: number;
    },
    type: NotificationType,
    channels: NotificationChannel[] = ['whatsapp', 'email']
  ): Promise<NotificationLog[]> {
    const enqueued: NotificationLog[] = [];
    const supabase = createAdminClient();

    for (const channel of channels) {
      const idempotencyKey = this.buildIdempotencyKey(order.id, type, channel);
      const maskedRecipient =
        channel === 'email'
          ? maskEmail(order.email || `${order.customer_name?.toLowerCase().replace(/\s+/g, '') || 'cust'}@example.com`)
          : maskPhoneNumber(order.phone);

      const payloadSummary = {
        order_number: order.order_number,
        deposit_amount: order.deposit_amount || 49,
        cod_amount: order.cod_amount || 450,
        carrier: order.carrier || '',
        tracking_number: order.tracking_number || '',
        has_tracking_url: Boolean(order.tracking_url),
      };

      try {
        const { data, error } = await supabase
          .from('notification_logs')
          .insert({
            order_id: order.id,
            order_number: order.order_number,
            notification_type: type,
            channel,
            masked_recipient: maskedRecipient,
            status: 'pending',
            provider: 'mock',
            idempotency_key: idempotencyKey,
            payload_summary: payloadSummary,
            attempt_count: 0,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            // Idempotent duplicate: already enqueued, fetch existing
            const { data: existing } = await supabase
              .from('notification_logs')
              .select('*')
              .eq('idempotency_key', idempotencyKey)
              .maybeSingle();
            if (existing) enqueued.push(existing as NotificationLog);
            continue;
          }

          // Database persistence error: log server-side error
          console.error(`[NotificationService] Database enqueue failure (${channel}):`, error.message, `Code: ${error.code}`);

          // In production: FAIL CLOSED. No in-memory queue, no notification dispatch.
          if (this.isFallbackAllowed()) {
            const fallbackItem = this.enqueueFallback(order, type, channel, idempotencyKey, maskedRecipient, payloadSummary);
            enqueued.push(fallbackItem);
          }
          continue;
        } else if (data) {
          enqueued.push(data as NotificationLog);
        }
      } catch (err: any) {
        // Unexpected database/network exception: log server-side error
        console.error(`[NotificationService] Database enqueue exception (${channel}):`, err?.message);

        // In production: FAIL CLOSED. No in-memory queue, no notification dispatch.
        if (this.isFallbackAllowed()) {
          const fallbackItem = this.enqueueFallback(order, type, channel, idempotencyKey, maskedRecipient, payloadSummary);
          enqueued.push(fallbackItem);
        }
      }
    }

    // Trigger asynchronous dispatch ONLY for genuinely enqueued pending jobs
    for (const log of enqueued) {
      if (log.status === 'pending') {
        this.claimAndDispatch(log.id, {
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name || 'Customer',
          phone: order.phone || '',
          email: order.email,
          type,
          channel: log.channel,
          trackingUrl: order.tracking_url,
          carrier: order.carrier,
          trackingNumber: order.tracking_number,
          depositAmount: order.deposit_amount,
          codAmount: order.cod_amount,
          totalAmount: order.total_amount,
        }).catch((err) => {
          console.error(`[NotificationService] Async dispatch uncaught error (${log.id}):`, err?.message);
        });
      }
    }

    return enqueued;
  }

  /**
   * Concurrency-safe atomic lease claim & execution:
   * 1. Atomically transitions pending/failed -> sending (recovering stale leases > 5 min).
   * 2. Dispatches via provider adapter.
   * 3. Transitions to sent (on success) or failed (on error).
   */
  public static async claimAndDispatch(
    logId: string,
    payloadFallback?: Partial<NotificationPayload>
  ): Promise<ProviderDispatchResult> {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let claimedLog: NotificationLog | null = null;

    try {
      // Atomic claim query
      const { data, error } = await supabase
        .from('notification_logs')
        .update({
          status: 'sending',
          locked_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', logId)
        .or(`status.in.(pending,failed),and(status.eq.sending,locked_at.lt.${fiveMinutesAgo})`)
        .select()
        .maybeSingle();

      if (!error && data) {
        // Increment attempt count safely
        await supabase
          .from('notification_logs')
          .update({ attempt_count: (data.attempt_count || 0) + 1 })
          .eq('id', logId);
        data.attempt_count = (data.attempt_count || 0) + 1;
        claimedLog = data as NotificationLog;
      } else if (this.isFallbackAllowed()) {
        claimedLog = this.claimFallback(logId);
      } else if (error) {
        console.error('[NotificationService] Database claim error:', error.message);
      }
    } catch (err: any) {
      if (this.isFallbackAllowed()) {
        claimedLog = this.claimFallback(logId);
      } else {
        console.error('[NotificationService] Database claim exception:', err?.message);
      }
    }

    if (!claimedLog) {
      // Another worker claimed or job is already sent
      return { success: false, error: 'Job not eligible for claim or already processing' };
    }

    // Resolve provider adapter
    const adapter = AdapterRegistry.get(claimedLog.channel, claimedLog.provider);
    if (!adapter) {
      await this.markFailed(logId, `No adapter found for channel: ${claimedLog.channel}`);
      return { success: false, error: `No adapter found for channel: ${claimedLog.channel}` };
    }

    // Construct dispatch payload
    const payload: NotificationPayload = {
      orderId: claimedLog.order_id,
      orderNumber: claimedLog.order_number,
      customerName: payloadFallback?.customerName || 'Valued Customer',
      phone: payloadFallback?.phone || '9999999999',
      email: payloadFallback?.email,
      type: claimedLog.notification_type,
      channel: claimedLog.channel,
      trackingUrl: payloadFallback?.trackingUrl,
      carrier: payloadFallback?.carrier,
      trackingNumber: payloadFallback?.trackingNumber,
      depositAmount: payloadFallback?.depositAmount || 49,
      codAmount: payloadFallback?.codAmount || 450,
      totalAmount: payloadFallback?.totalAmount || 499,
    };

    try {
      const result = await adapter.send(payload);
      if (result.success) {
        await this.markSent(logId, result.providerMessageId || 'mock_msg');
        return result;
      } else {
        await this.markFailed(logId, result.error || 'Provider delivery error');
        return result;
      }
    } catch (sendErr: any) {
      await this.markFailed(logId, sendErr?.message || 'Adapter execution exception');
      return { success: false, error: sendErr?.message };
    }
  }

  /**
   * Admin-initiated retry for a failed notification.
   * Operates on the existing record with atomic claim.
   */
  public static async retry(logId: string): Promise<ProviderDispatchResult> {
    return this.claimAndDispatch(logId);
  }

  private static async markSent(logId: string, providerMsgId: string): Promise<void> {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({
          status: 'sent',
          sent_at: nowIso,
          provider_message_id: providerMsgId,
          error_message: null,
          locked_at: null,
          updated_at: nowIso,
        })
        .eq('id', logId);

      if (error) {
        console.error('[NotificationService] Failed to mark notification sent in database:', error.message);
        if (this.isFallbackAllowed()) {
          const item = fallbackLogs.get(logId);
          if (item) {
            item.status = 'sent';
            item.sent_at = nowIso;
            item.provider_message_id = providerMsgId;
            item.error_message = undefined;
            item.locked_at = null;
          }
        }
      }
    } catch (err: any) {
      console.error('[NotificationService] Exception marking notification sent in database:', err?.message);
      if (this.isFallbackAllowed()) {
        const item = fallbackLogs.get(logId);
        if (item) {
          item.status = 'sent';
          item.sent_at = nowIso;
          item.provider_message_id = providerMsgId;
          item.error_message = undefined;
          item.locked_at = null;
        }
      }
    }
  }

  private static async markFailed(logId: string, errorMsg: string): Promise<void> {
    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: errorMsg,
          locked_at: null,
          updated_at: nowIso,
        })
        .eq('id', logId);

      if (error) {
        console.error('[NotificationService] Failed to mark notification failed in database:', error.message);
        if (this.isFallbackAllowed()) {
          const item = fallbackLogs.get(logId);
          if (item) {
            item.status = 'failed';
            item.error_message = errorMsg;
            item.locked_at = null;
          }
        }
      }
    } catch (err: any) {
      console.error('[NotificationService] Exception marking notification failed in database:', err?.message);
      if (this.isFallbackAllowed()) {
        const item = fallbackLogs.get(logId);
        if (item) {
          item.status = 'failed';
          item.error_message = errorMsg;
          item.locked_at = null;
        }
      }
    }
  }

  // --- In-memory Fallback Handlers (Explicit Dev/Test Only) ---

  private static enqueueFallback(
    order: any,
    type: NotificationType,
    channel: NotificationChannel,
    idempotencyKey: string,
    maskedRecipient: string,
    payloadSummary: Record<string, any>
  ): NotificationLog {
    const existing = Array.from(fallbackLogs.values()).find((l) => l.idempotency_key === idempotencyKey);
    if (existing) return existing;

    const id = `flb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const log: NotificationLog = {
      id,
      order_id: order.id,
      order_number: order.order_number,
      notification_type: type,
      channel,
      masked_recipient: maskedRecipient,
      status: 'pending',
      provider: 'mock',
      idempotency_key: idempotencyKey,
      payload_summary: payloadSummary,
      attempt_count: 0,
      created_at: now,
      updated_at: now,
    };
    fallbackLogs.set(id, log);
    return log;
  }

  private static claimFallback(logId: string): NotificationLog | null {
    const item = fallbackLogs.get(logId);
    if (!item) return null;
    if (item.status === 'sent') return null;
    if (item.status === 'sending') {
      const isStale = item.locked_at && Date.now() - new Date(item.locked_at).getTime() > 5 * 60 * 1000;
      if (!isStale) return null;
    }

    item.status = 'sending';
    item.attempt_count = (item.attempt_count || 0) + 1;
    item.locked_at = new Date().toISOString();
    return item;
  }

  public static getFallbackLogs(): NotificationLog[] {
    if (!this.isFallbackAllowed()) return [];
    return Array.from(fallbackLogs.values());
  }

  public static clearFallbackLogs(): void {
    fallbackLogs.clear();
  }
}
