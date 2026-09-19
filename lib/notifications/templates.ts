/**
 * Reusable, professional customer notification templates for Email, WhatsApp, and SMS.
 * Concise, luxury tone adhering strictly to verified order terms (₹49 deposit + ₹450 COD).
 */

import { NotificationPayload, NotificationType } from './types';

export interface RenderedMessage {
  subject: string;
  body: string;
}

export function renderNotificationTemplate(
  type: NotificationType,
  payload: NotificationPayload
): RenderedMessage {
  const {
    orderNumber,
    customerName,
    depositAmount = 49,
    codAmount = 450,
    carrier,
    trackingNumber,
    trackingUrl,
  } = payload;

  const trackText = trackingUrl ? ` Track live: ${trackingUrl}` : '';

  switch (type) {
    case 'order_confirmed':
      return {
        subject: `NAMORA: Order #${orderNumber} Confirmed & In Production`,
        body: `Hello ${customerName}, your bespoke calligraphy frame order #${orderNumber} is confirmed! Booking deposit of ₹${depositAmount} received. Balance of ₹${codAmount} due on delivery.${trackText}`,
      };

    case 'payment_confirmed':
      return {
        subject: `NAMORA: Payment Verified for Order #${orderNumber}`,
        body: `Hello ${customerName}, advance booking deposit of ₹${depositAmount} for Order #${orderNumber} has been cryptographically verified. Production is now queued.${trackText}`,
      };

    case 'order_processing':
      return {
        subject: `NAMORA: Artisan Handcrafting in Progress #${orderNumber}`,
        body: `Hello ${customerName}, our master calligraphy artisans are hand-inscribing your bespoke frame on archival media for Order #${orderNumber}.${trackText}`,
      };

    case 'personalization_review':
      return {
        subject: `NAMORA: Calligraphy Quality Review #${orderNumber}`,
        body: `Hello ${customerName}, your custom names and lettering layout are currently undergoing master artisan inspection for Order #${orderNumber}.${trackText}`,
      };

    case 'ready_to_ship':
      return {
        subject: `NAMORA: Frame Assembled & Sealed #${orderNumber}`,
        body: `Hello ${customerName}, your A4 frame is mounted, acrylic-sealed, and packaged in dual-bubble protective casing ready for courier dispatch (Order #${orderNumber}).${trackText}`,
      };

    case 'shipped':
      return {
        subject: `NAMORA: Order #${orderNumber} Dispatched via ${carrier || 'Express Air'}`,
        body: `Hello ${customerName}, your NAMORA frame has been handed over to ${carrier || 'Express Air Courier'}.${trackingNumber ? ` AWB: ${trackingNumber}.` : ''}${trackText}`,
      };

    case 'out_for_delivery':
      return {
        subject: `NAMORA: Out for Delivery Today #${orderNumber}`,
        body: `Hello ${customerName}, your parcel is out for doorstep delivery today! Please keep ₹${codAmount} ready for COD settlement (Cash/UPI accepted).${trackText}`,
      };

    case 'delivered':
      return {
        subject: `NAMORA: Order #${orderNumber} Delivered`,
        body: `Hello ${customerName}, your bespoke NAMORA frame has been safely delivered! We hope it brings timeless beauty to your space. Thank you for choosing NAMORA.`,
      };

    case 'cancelled':
      return {
        subject: `NAMORA: Order #${orderNumber} Cancelled`,
        body: `Hello ${customerName}, Order #${orderNumber} has been cancelled. If an advance deposit was paid, our concierge team will assist you with resolution.`,
      };

    case 'returned':
      return {
        subject: `NAMORA: Courier Return Notification #${orderNumber}`,
        body: `Hello ${customerName}, Order #${orderNumber} was marked undelivered/returned by the courier. Please contact NAMORA Concierge to arrange redelivery.`,
      };

    default:
      return {
        subject: `NAMORA Order Update #${orderNumber}`,
        body: `Hello ${customerName}, there is a status update regarding your Order #${orderNumber}.${trackText}`,
      };
  }
}
