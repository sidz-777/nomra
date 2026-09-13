/**
 * NAMORA Order Status Mapping & Milestone Definitions
 * Exact reproduction of legacy status map, color hierarchy, and 5-milestone stepper logic.
 */

import { StatusConfig, TrackingMilestone, TrackingOrderSafe } from './types';

export const ORDER_STATUS_MAP: Record<string, StatusConfig> = {
  pending_payment: {
    label: 'Awaiting ₹49 Deposit',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.15)',
    step: 0,
  },
  pending_advance: {
    label: 'Awaiting ₹49 Deposit',
    color: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.15)',
    step: 0,
  },
  confirmed: {
    label: 'Confirmed & Deposit Paid',
    color: '#A3E635',
    bg: 'rgba(163, 230, 53, 0.15)',
    step: 1,
  },
  advance_paid: {
    label: 'Confirmed & Deposit Paid',
    color: '#A3E635',
    bg: 'rgba(163, 230, 53, 0.15)',
    step: 1,
  },
  processing: {
    label: 'In Calligraphy Studio',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    step: 2,
  },
  in_production: {
    label: 'In Calligraphy Studio',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    step: 2,
  },
  personalization_review: {
    label: 'Calligraphy Review',
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.15)',
    step: 2,
  },
  ready_to_ship: {
    label: 'Packed & Quality Verified',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    step: 3,
  },
  shipped: {
    label: 'Dispatched with Courier',
    color: '#D4AF6A',
    bg: 'rgba(212, 175, 106, 0.15)',
    step: 4,
  },
  dispatched: {
    label: 'Dispatched with Courier',
    color: '#D4AF6A',
    bg: 'rgba(212, 175, 106, 0.15)',
    step: 4,
  },
  out_for_delivery: {
    label: 'Out for Delivery Today',
    color: '#FB923C',
    bg: 'rgba(251, 146, 60, 0.15)',
    step: 5,
  },
  delivered: {
    label: 'Delivered & Completed',
    color: '#4ADE80',
    bg: 'rgba(74, 222, 128, 0.15)',
    step: 6,
  },
  cancelled: {
    label: 'Order Cancelled',
    color: '#F87171',
    bg: 'rgba(248, 113, 113, 0.15)',
    step: -1,
  },
  returned: {
    label: 'Returned to Studio',
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.15)',
    step: -2,
  },
};

/**
 * Resolves the display configuration for a given order status.
 */
export function getStatusConfig(status: string): StatusConfig {
  const normalized = (status || '').toLowerCase().trim();
  return (
    ORDER_STATUS_MAP[normalized] || {
      label: status || 'Processing',
      color: '#A3E635',
      bg: 'rgba(163, 230, 53, 0.15)',
      step: 1,
    }
  );
}

/**
 * Builds the 5 linear progress milestones matching legacy stepper.
 */
export function buildMilestones(order: TrackingOrderSafe): TrackingMilestone[] {
  const statusCfg = getStatusConfig(order.status);
  const activeStep = statusCfg.step;

  const rawMilestones = [
    {
      title: 'Order Confirmed & ₹49 Deposit Verified',
      desc: `Reservation deposit of ₹${order.deposit_amount} received via Razorpay. Order locked for production.`,
    },
    {
      title: 'Calligraphy Inscribed by Artisan',
      desc: 'Authentic Persian/oriental lettering hand-composed on 300 GSM archival media.',
    },
    {
      title: 'A4 Frame Assembled & Quality Sealed',
      desc: 'Mounted in matte black moulding with crystal-clear acrylic glass and double-bubble protection.',
    },
    {
      title: order.courier_name
        ? `Dispatched via ${order.courier_name} Air Express`
        : 'Dispatched via Express Courier',
      desc: order.tracking_number
        ? `AWB: ${order.tracking_number} · Fast transit to delivery hub`
        : 'Handed over to priority logistics network with live transit tracking.',
    },
    {
      title: 'Out for Delivery & COD Settlement',
      desc: `Courier executive out for delivery. Pay remaining COD balance of ₹${order.cod_amount} via cash or UPI.`,
    },
  ];

  return rawMilestones.map((m, idx) => {
    const stepNumber = idx + 1;
    let state: 'completed' | 'active' | 'upcoming' = 'upcoming';

    if (stepNumber < activeStep) {
      state = 'completed';
    } else if (stepNumber === activeStep) {
      state = 'active';
    } else {
      state = 'upcoming';
    }

    return {
      title: m.title,
      desc: m.desc,
      stepNumber,
      state,
    };
  });
}

/**
 * Builds WhatsApp Concierge inquiry URL for an existing order.
 */
export function buildOrderInquiryWhatsAppUrl(orderNumber: string, phone: string = '919305654028'): string {
  const text = `Hi NAMORA, I have an inquiry regarding my Order #${orderNumber}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds WhatsApp Concierge inquiry URL when an order lookup fails.
 */
export function buildNotFoundWhatsAppUrl(query: string, phone: string = '919305654028'): string {
  const text = `Hi NAMORA, I need help tracking my order for ${query}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
