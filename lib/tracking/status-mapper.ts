/**
 * NAMORA Order Status Mapping & Milestone Definitions
 * Comprehensive mapping of authoritative backend states to intuitive customer milestones.
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
    label: 'Personalization Review',
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.15)',
    step: 3,
  },
  ready_to_ship: {
    label: 'Packed & Quality Verified',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    step: 4,
  },
  shipped: {
    label: 'Dispatched with Courier',
    color: '#D4AF6A',
    bg: 'rgba(212, 175, 106, 0.15)',
    step: 5,
  },
  dispatched: {
    label: 'Dispatched with Courier',
    color: '#D4AF6A',
    bg: 'rgba(212, 175, 106, 0.15)',
    step: 5,
  },
  out_for_delivery: {
    label: 'Out for Doorstep Delivery',
    color: '#FB923C',
    bg: 'rgba(251, 146, 60, 0.15)',
    step: 6,
  },
  delivered: {
    label: 'Safely Delivered',
    color: '#4ADE80',
    bg: 'rgba(74, 222, 128, 0.15)',
    step: 7,
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
 * Builds customer milestones matching the authoritative backend states.
 * Formats timestamps cleanly when available without inventing fake data.
 */
export function buildMilestones(order: TrackingOrderSafe): TrackingMilestone[] {
  const statusCfg = getStatusConfig(order.status);
  const activeStep = statusCfg.step;
  const carrierName = order.carrier || order.courier_name || 'Express Air Courier';

  const rawMilestones = [
    {
      title: 'Order Confirmed & Booking Deposit Verified',
      desc: `₹${order.deposit_amount} reservation deposit received via Razorpay. Production queued.`,
      timestamp: order.created_at ? formatTimestamp(order.created_at) : undefined,
    },
    {
      title: 'Artisan Studio Preparation',
      desc: 'Authentic Persian/oriental calligraphy composed by hand on 300 GSM archival media.',
      timestamp: undefined,
    },
    {
      title: 'Personalization & Calligraphy Layout Review',
      desc: 'Master artisan inspection of letterforms, vowel marks, and design aesthetic harmony.',
      timestamp: undefined,
    },
    {
      title: 'A4 Frame Assembled & Quality Sealed',
      desc: 'Mounted in matte black moulding with crystal acrylic glass and protective foam wrap.',
      timestamp: undefined,
    },
    {
      title: `Dispatched via ${carrierName}`,
      desc: order.tracking_number
        ? `AWB: ${order.tracking_number} · Fast transit to delivery hub.`
        : `Handed over to priority logistics network with live transit tracking.`,
      timestamp: order.dispatched_at ? formatTimestamp(order.dispatched_at) : undefined,
    },
    {
      title: 'Out for Doorstep Delivery',
      desc: `Courier executive out for delivery. Pay remaining COD balance of ₹${order.cod_amount} via Cash or UPI.`,
      timestamp: undefined,
    },
    {
      title: 'Safely Delivered',
      desc: 'Parcel handed over to customer. Bespoke frame delivery complete.',
      timestamp: order.delivered_at ? formatTimestamp(order.delivered_at) : undefined,
    },
  ];

  return rawMilestones.map((m, idx) => {
    const stepNumber = idx + 1;
    let state: 'completed' | 'active' | 'upcoming' = 'upcoming';

    if (activeStep < 0) {
      state = 'upcoming';
    } else if (stepNumber < activeStep) {
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
      timestamp: m.timestamp,
    };
  });
}

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function buildOrderInquiryWhatsAppUrl(orderNumber: string, phone: string = '919305654028'): string {
  const text = `Hi NAMORA, I have an inquiry regarding my Order #${orderNumber}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildNotFoundWhatsAppUrl(query: string, phone: string = '919305654028'): string {
  const text = `Hi NAMORA, I need help tracking my order for ${query}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
