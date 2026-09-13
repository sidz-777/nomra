/**
 * NAMORA Admin In-Memory Orders Store
 * Resilient fallback store for local development, demo mode, and offline operation.
 * Synchronizes with database whenever reachable.
 */

import { AdminOrderRecord } from './types';

export const INITIAL_DEMO_ORDERS: AdminOrderRecord[] = [
  {
    id: 'demo-1',
    order_number: 'NAM-8421',
    customer_name: 'Ayesha Khan',
    phone: '9876543210',
    address: 'Flat 402, Al-Noor Residency, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    total_amount: 568.0,
    deposit_amount: 49.0,
    cod_amount: 519.0,
    status: 'personalization_review',
    payment_method: 'deposit_cod',
    payment_status: 'paid',
    courier_name: 'BlueDart Air',
    tracking_number: 'BLUEDART-842918',
    tracking_url: 'https://www.bluedart.com/tracking?track=BLUEDART-842918',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    production_checklist: {
      step1: true,
      step2: true,
      step3: true,
      step4: true,
      step5: false,
      step6: false,
      step7: false,
      step8: false,
      step9: false,
      step10: false,
    },
    items: [
      {
        product_title: 'Red Persian Carpet Frame',
        product_image: 'design1.jpg',
        is_ready_made: false,
        english_name: 'Ayesha',
        arabic_name: 'عائشة',
        ink_style: 'Gold Foil',
        font_style: 'Royal',
        has_gift: true,
        gift_to: 'Zainab',
        gift_from: 'Ayesha',
        gift_message: 'Happy Birthday to my dearest sister!',
        price: 568.0,
        deposit: 49.0,
        cod: 519.0,
      },
    ],
  },
  {
    id: 'demo-2',
    order_number: 'NAM-8422',
    customer_name: 'Zaid Al-Mansoor',
    phone: '9123456789',
    address: 'Villa 12, Palm Meadows, Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    total_amount: 998.0,
    deposit_amount: 98.0,
    cod_amount: 900.0,
    status: 'shipped',
    payment_method: 'deposit_cod',
    payment_status: 'paid',
    courier_name: 'Delhivery Express',
    tracking_number: 'DELH-9928172',
    tracking_url: 'https://www.delhivery.com/track/package/DELH-9928172',
    dispatched_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    production_checklist: {
      step1: true,
      step2: true,
      step3: true,
      step4: true,
      step5: true,
      step6: true,
      step7: true,
      step8: true,
      step9: true,
      step10: true,
    },
    items: [
      {
        product_title: 'Porsche 911 GT3 RS',
        product_image: 'car1.jpg',
        is_ready_made: true,
        category_label: 'Supercars',
        price: 499.0,
        deposit: 49.0,
        cod: 450.0,
      },
      {
        product_title: 'Cristiano Ronaldo — CR7 1985',
        product_image: 'sport14.jpg',
        is_ready_made: true,
        category_label: 'Sports Legends',
        price: 499.0,
        deposit: 49.0,
        cod: 450.0,
      },
    ],
  },
];

class AdminMemoryStore {
  private orders: Map<string, AdminOrderRecord> = new Map();

  constructor() {
    INITIAL_DEMO_ORDERS.forEach((o) => {
      this.orders.set(o.id, { ...o });
    });
  }

  public getAllOrders(): AdminOrderRecord[] {
    return Array.from(this.orders.values());
  }

  public getOrder(idOrNumber: string): AdminOrderRecord | undefined {
    if (this.orders.has(idOrNumber)) {
      return this.orders.get(idOrNumber);
    }
    return Array.from(this.orders.values()).find((o) => o.order_number === idOrNumber);
  }

  public setOrder(order: AdminOrderRecord): void {
    this.orders.set(order.id, order);
  }

  public updateOrderStatus(idOrNumber: string, status: string): AdminOrderRecord | null {
    const order = this.getOrder(idOrNumber);
    if (!order) return null;
    order.status = status;
    order.updated_at = new Date().toISOString();
    if (status === 'shipped' || status === 'dispatched') {
      order.dispatched_at = new Date().toISOString();
    }
    if (status === 'delivered') {
      order.delivered_at = new Date().toISOString();
    }
    if (status === 'cancelled') {
      order.cancelled_at = new Date().toISOString();
    }
    this.orders.set(order.id, order);
    return order;
  }

  public updateChecklist(idOrNumber: string, checklist: any): AdminOrderRecord | null {
    const order = this.getOrder(idOrNumber);
    if (!order) return null;
    order.production_checklist = { ...(order.production_checklist || {}), ...checklist };
    order.updated_at = new Date().toISOString();
    this.orders.set(order.id, order);
    return order;
  }

  public saveShipping(
    idOrNumber: string,
    courier: string,
    awb: string,
    url: string,
    markShipped: boolean
  ): AdminOrderRecord | null {
    const order = this.getOrder(idOrNumber);
    if (!order) return null;
    order.courier_name = courier;
    order.tracking_number = awb;
    order.tracking_url = url;
    if (markShipped) {
      order.status = 'shipped';
      order.dispatched_at = new Date().toISOString();
    }
    order.updated_at = new Date().toISOString();
    this.orders.set(order.id, order);
    return order;
  }
}

// Global singleton
const globalForAdminStore = globalThis as unknown as {
  adminOrdersStore?: AdminMemoryStore;
};

export const adminOrdersStore = globalForAdminStore.adminOrdersStore || new AdminMemoryStore();
if (process.env.NODE_ENV !== 'production') {
  globalForAdminStore.adminOrdersStore = adminOrdersStore;
}
