'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminGuard, { useAdminAuth } from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { AdminOrderRecord, ProductionChecklist, CustomerProfileAdmin, ReviewAdminItem } from '@/lib/admin/types';

// Standard 10-Point Checklist steps matching legacy admin.js
const CHECKLIST_STEPS = [
  { id: 'step1', label: '1. Customer contact & shipping address verified' },
  { id: 'step2', label: '2. Frame design & size (A4) confirmed' },
  { id: 'step3', label: '3. English spelling verified' },
  { id: 'step4', label: '4. Arabic calligraphy spelling verified' },
  { id: 'step5', label: '5. Font style & layout checked' },
  { id: 'step6', label: '6. Finish & moulding quality inspected' },
  { id: 'step7', label: '7. Live preview alignment matched' },
  { id: 'step8', label: '8. Frame assembled with crystal acrylic glass' },
  { id: 'step9', label: '9. Final quality check & scratch inspection' },
  { id: 'step10', label: '10. Gift ribbon / packaging & note card placed' }
];

// Fallback demo orders matching legacy admin.js DEMO_ORDERS
const DEMO_ORDERS: AdminOrderRecord[] = [
  {
    id: 'demo-1',
    order_number: 'NAM-8421',
    customer_name: 'Ayesha Khan',
    phone: '9876543210',
    address: 'Flat 402, Al-Noor Residency, Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    total_amount: 568.00,
    deposit_amount: 49.00,
    cod_amount: 519.00,
    status: 'personalization_review',
    payment_method: 'deposit_cod',
    payment_status: 'paid',
    courier_name: 'BlueDart Air',
    tracking_number: 'BLUEDART-842918',
    tracking_url: 'https://www.bluedart.com/tracking?track=BLUEDART-842918',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    production_checklist: {
      step1: true, step2: true, step3: true, step4: true, step5: false,
      step6: false, step7: false, step8: false, step9: false, step10: false
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
        price: 568.00,
        deposit: 49.00,
        cod: 519.00
      }
    ]
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
    total_amount: 998.00,
    deposit_amount: 98.00,
    cod_amount: 900.00,
    status: 'shipped',
    payment_method: 'deposit_cod',
    payment_status: 'paid',
    courier_name: 'Delhivery Express',
    tracking_number: 'DELH-9928172',
    tracking_url: 'https://www.delhivery.com/track/package/DELH-9928172',
    dispatched_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    production_checklist: {
      step1: true, step2: true, step3: true, step4: true, step5: true,
      step6: true, step7: true, step8: true, step9: true, step10: true
    },
    items: [
      {
        product_title: 'Porsche 911 GT3 RS',
        product_image: 'car1.jpg',
        is_ready_made: true,
        category_label: 'Supercars',
        price: 499.00,
        deposit: 49.00,
        cod: 450.00
      },
      {
        product_title: 'Cristiano Ronaldo — CR7 1985',
        product_image: 'sport14.jpg',
        is_ready_made: true,
        category_label: 'Sports Legends',
        price: 499.00,
        deposit: 49.00,
        cod: 450.00
      }
    ]
  }
];

// WhatsApp 11-Template definition
const WA_TEMPLATES = [
  {
    name: '1. Order Received & Awaiting Deposit',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🌟\n\nThank you for choosing NAMORA. We have received your order *${o.order_number}* for ${(o.items || []).length} handmade A4 frame(s).\n\nTo confirm and begin crafting in our calligraphy studio, please pay the ₹${Math.round(o.deposit_amount)} advance deposit via UPI.\n\nUPI ID: *namoraworld@upi*\n(Remaining ₹${Math.round(o.cod_amount)} is Cash on Delivery upon doorstep arrival).\n\nPlease reply with a screenshot once paid! ✦`
  },
  {
    name: '2. Deposit Payment Confirmed',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! ✨\n\nYour ₹${Math.round(o.deposit_amount)} deposit for NAMORA order *${o.order_number}* has been verified successfully!\n\nYour order is now officially confirmed. Remaining COD balance: ₹${Math.round(o.cod_amount)}.\n\nOur master artisans are now preparing your artwork in the calligraphy studio.`
  },
  {
    name: '3. Personalization Details Review',
    generate: (o: AdminOrderRecord) => {
      const p = (o.items || []).find((i) => !i.is_ready_made) || (o.items || [])[0] || {};
      return `Hi ${o.customer_name}! 🖋️\n\nPlease confirm your personalization details for order *${o.order_number}*:\n\n• Name: *${p.english_name || 'N/A'}*\n• Calligraphy: *${p.arabic_name || 'N/A'}*\n• Style: *${p.font_style || 'Classic'}*\n• Finish: *${p.ink_style || 'Obsidian Black'}*\n\nIf any corrections are needed, reply immediately. Otherwise, crafting will begin!`;
    }
  },
  {
    name: '4. Frame in Calligraphy Production',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🎨\n\nYour handmade frame for order *${o.order_number}* is now being crafted in our calligraphy studio!\n\nEach piece uses 300 GSM archival cardstock, satin wood moulding, and crystal acrylic glass. We will share dispatch details shortly.`
  },
  {
    name: '5. Frame Ready to Ship',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 📦\n\nYour frame order *${o.order_number}* has passed our 10-point quality inspection and is packaged with luxury satin ribbon.\n\nHandover to our express air courier partner is scheduled for today.`
  },
  {
    name: '6. Dispatched + Courier AWB Link',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🚚\n\nYour NAMORA frame order *${o.order_number}* has been dispatched!\n\n• Courier: *${o.courier_name || 'Express Courier'}*\n• AWB Tracking: *${o.tracking_number || 'Available soon'}*\n• COD Balance: *₹${Math.round(o.cod_amount)}*\n\nLive Tracking: ${o.tracking_url || 'https://namoraworld.com'}\nExpected doorstep delivery in 2–3 days.`
  },
  {
    name: '7. Out for Delivery Alert',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🛵\n\nYour NAMORA package *${o.order_number}* is OUT FOR DELIVERY today!\n\nPlease keep *₹${Math.round(o.cod_amount)}* exact cash ready for the delivery agent.\n\nGet ready to display your luxury personalized frame! ✨`
  },
  {
    name: '8. Delivered & Feedback Request',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🏡\n\nYour NAMORA frame order *${o.order_number}* has been marked as delivered!\n\nWe hope it brings warmth and luxury to your space. Please take a photo, tag us, and let us know how much you love it! ✦`
  },
  {
    name: '9. COD Balance Reminder',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! 🔔\n\nReminder for your upcoming NAMORA frame delivery (*${o.order_number}*):\n\nYour COD balance due at doorstep is *₹${Math.round(o.cod_amount)}*. Both cash and delivery UPI QR codes are supported by the courier.`
  },
  {
    name: '10. Order Cancellation Notice',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}. Your NAMORA order *${o.order_number}* has been cancelled as requested. Any advance payment will be processed per our refund policy. Thank you for visiting NAMORA.`
  },
  {
    name: '11. Dedicated Customer Support',
    generate: (o: AdminOrderRecord) =>
      `Hi ${o.customer_name}! This is the NAMORA concierge team regarding your order *${o.order_number}*. How may we assist you today?`
  }
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'reviews'>('orders');
  const [orders, setOrders] = useState<AdminOrderRecord[]>(DEMO_ORDERS);
  const [customers, setCustomers] = useState<CustomerProfileAdmin[]>([]);
  const [reviews, setReviews] = useState<ReviewAdminItem[]>([]);

  // Filters & State
  const [timeframe, setTimeframe] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subTagFilter, setSubTagFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [whatsAppOrder, setWhatsAppOrder] = useState<AdminOrderRecord | null>(null);
  const [whatsAppTemplateIdx, setWhatsAppTemplateIdx] = useState<number>(0);
  const [awbWarning, setAwbWarning] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states in detail modal
  const [modalCourier, setModalCourier] = useState<string>('BlueDart Air');
  const [modalCustomCourier, setModalCustomCourier] = useState<string>('');
  const [modalAwb, setModalAwb] = useState<string>('');

  const { isDemo } = useAdminAuth();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load orders & analytics
  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
          setOrders(json.orders);
          return;
        }
      }
    } catch (err) {
      console.warn('Orders fetch note:', err);
    }
  };

  // Load customers
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.customers)) {
          setCustomers(json.customers);
        }
      }
    } catch (err) {
      console.warn('Customers fetch note:', err);
    }
  };

  // Load reviews
  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          setReviews(json.reviews);
        }
      }
    } catch (err) {
      console.warn('Reviews fetch note:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [timeframe]);

  useEffect(() => {
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  // Metrics computation
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const pendingAdvance = orders.filter((o) => o.status === 'pending_payment' || o.status === 'pending_advance').length;
    const inStudio = orders.filter((o) => o.status === 'personalization_review' || o.status === 'in_production' || o.status === 'processing').length;
    const dispatched = orders.filter((o) => o.status === 'shipped' || o.status === 'dispatched').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;

    let grossRevenue = 0;
    let depositsCollected = 0;
    let codOutstanding = 0;

    orders.forEach((o) => {
      grossRevenue += Number(o.total_amount) || 0;
      if (o.status !== 'cancelled') {
        depositsCollected += Number(o.deposit_amount) || 0;
        if (o.status !== 'delivered') {
          codOutstanding += Number(o.cod_amount) || 0;
        }
      }
    });

    const aov = totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0;

    return {
      totalOrders,
      pendingAdvance,
      inStudio,
      dispatched,
      delivered,
      grossRevenue: Math.round(grossRevenue),
      depositsCollected: Math.round(depositsCollected),
      codOutstanding: Math.round(codOutstanding),
      aov,
    };
  }, [orders]);

  // Status Filter Counts
  const filterCounts = useMemo(() => {
    return {
      all: orders.length,
      pending_payment: orders.filter((o) => o.status === 'pending_payment' || o.status === 'pending_advance').length,
      confirmed: orders.filter((o) => o.status === 'confirmed' || o.status === 'advance_paid').length,
      in_studio: orders.filter((o) => o.status === 'personalization_review' || o.status === 'in_production' || o.status === 'processing').length,
      ready_to_ship: orders.filter((o) => o.status === 'ready_to_ship').length,
      shipped: orders.filter((o) => o.status === 'shipped' || o.status === 'dispatched').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filtered and searched orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_payment' && o.status !== 'pending_payment' && o.status !== 'pending_advance') return false;
        if (statusFilter === 'confirmed' && o.status !== 'confirmed' && o.status !== 'advance_paid') return false;
        if (statusFilter === 'in_studio' && o.status !== 'personalization_review' && o.status !== 'in_production' && o.status !== 'processing') return false;
        if (statusFilter === 'ready_to_ship' && o.status !== 'ready_to_ship') return false;
        if (statusFilter === 'shipped' && o.status !== 'shipped' && o.status !== 'dispatched') return false;
        if (statusFilter === 'delivered' && o.status !== 'delivered') return false;
        if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;
      }

      // 2. Subtag filter
      if (subTagFilter !== 'all') {
        const items = o.items || [];
        if (subTagFilter === 'gift') {
          if (!items.some((i) => i.has_gift)) return false;
        } else if (subTagFilter === 'personalized') {
          if (!items.some((i) => !i.is_ready_made)) return false;
        } else if (subTagFilter === 'ready_stock') {
          if (!items.some((i) => i.is_ready_made)) return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (o.order_number || '').toLowerCase();
        const cust = (o.customer_name || '').toLowerCase();
        const ph = (o.phone || '').toLowerCase();
        const awb = (o.tracking_number || '').toLowerCase();
        if (!num.includes(q) && !cust.includes(q) && !ph.includes(q) && !awb.includes(q)) return false;
      }

      return true;
    });
  }, [orders, statusFilter, subTagFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Status Change Handler
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, new_status: newStatus, admin_user: 'admin@namora' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        showToast(`Order status transitioned to ${newStatus.replace(/_/g, ' ')}!`);
      } else {
        showToast(`Error: ${data?.error || 'Transition not allowed'}`);
      }
    } catch (err) {
      console.warn('Status change fallback:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
  };

  // Checklist Step Toggle
  const handleChecklistToggle = async (orderId: string, stepId: string, checked: boolean) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedChecklist: ProductionChecklist = {
      ...(order.production_checklist || {}),
      [stepId]: checked,
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, production_checklist: updatedChecklist } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, production_checklist: updatedChecklist });
    }

    try {
      await fetch('/api/admin/update-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, checklist: updatedChecklist }),
      });
    } catch (e) {
      console.warn('Checklist sync error:', e);
    }
  };

  // Open Order Detail Modal
  const openDetailModal = (order: AdminOrderRecord) => {
    setSelectedOrder(order);
    setModalCourier(order.courier_name || 'BlueDart Air');
    setModalCustomCourier('');
    setModalAwb(order.tracking_number || '');
    setAwbWarning(null);
    setIsDetailModalOpen(true);
  };

  // Save Shipping Info
  const handleSaveShipping = async (markAsShipped: boolean) => {
    if (!selectedOrder) return;
    setAwbWarning(null);

    let courier = modalCourier;
    if (courier === 'Other') {
      courier = modalCustomCourier.trim() || 'Express Courier';
    }

    const awb = modalAwb.trim();

    let trackUrl = '';
    if (courier.includes('BlueDart')) trackUrl = `https://www.bluedart.com/tracking?track=${awb}`;
    else if (courier.includes('Delhivery')) trackUrl = `https://www.delhivery.com/track/package/${awb}`;
    else if (courier.includes('DTDC')) trackUrl = 'https://www.dtdc.in/tracking.asp';
    else if (courier.includes('XpressBees')) trackUrl = 'https://www.xpressbees.com/track';
    else if (courier.includes('India Post')) trackUrl = 'https://www.indiapost.gov.in';

    try {
      const res = await fetch('/api/admin/save-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          courier_name: courier,
          tracking_number: awb,
          tracking_url: trackUrl,
          mark_shipped: markAsShipped,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updated: AdminOrderRecord = {
          ...selectedOrder,
          courier_name: courier,
          tracking_number: awb,
          tracking_url: trackUrl,
          status: markAsShipped ? 'shipped' : selectedOrder.status,
          dispatched_at: markAsShipped ? new Date().toISOString() : selectedOrder.dispatched_at,
        };
        setSelectedOrder(updated);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

        if (data.warning) {
          setAwbWarning(data.warning);
        } else {
          showToast('Shipping details saved successfully!');
        }
      }
    } catch (err) {
      showToast('Shipping details saved (Local Preview)!');
    }
  };

  // WhatsApp Modal Handlers
  const openWhatsAppModal = (order: AdminOrderRecord) => {
    setWhatsAppOrder(order);
    setWhatsAppTemplateIdx(0);
  };

  const handleLaunchWhatsApp = () => {
    if (!whatsAppOrder) return;
    const tmpl = WA_TEMPLATES[whatsAppTemplateIdx];
    const msg = tmpl.generate(whatsAppOrder);
    const cleanPhone = whatsAppOrder.phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setWhatsAppOrder(null);
  };

  // Review Actions
  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (action === 'delete') {
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } else {
          const newStatus = action === 'approve' ? 'approved' : 'rejected';
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
          );
        }
        showToast(`Review action "${action}" completed!`);
      }
    } catch (e) {
      console.warn('Review action error:', e);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient
        title="Order Operations &amp; Dispatch"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            {toastMessage}
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-xl bg-[#D4AF6A]/10 border border-[#D4AF6A]/30 flex items-center justify-between gap-4">
            <div>
              <strong className="text-[#D4AF6A] text-xs font-mono">⚡ Demo Preview Mode Active</strong>
              <p className="text-[11px] text-[#A39684] mt-0.5">
                Displaying sample frame orders. Connected to live Next.js architecture.
              </p>
            </div>
            <a
              href="/admin/settings"
              className="px-3 py-1.5 rounded-lg bg-[#1A1816] border border-[#D4AF6A]/30 text-xs font-mono text-[#D4AF6A] hover:bg-[#D4AF6A]/20 transition-all shrink-0"
            >
              Config Guide &rarr;
            </a>
          </div>
        )}

        {/* TOP TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-[#2D2722] pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            📦 Orders &amp; Dispatch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'customers'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            👥 Customers Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'reviews'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            ⭐ Reviews Moderation
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: ORDERS & DISPATCH */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Analytics Timeframe Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A1816] p-3 rounded-xl border border-[#2D2722]">
              <div className="text-xs font-mono uppercase tracking-wider text-[#A39684] flex items-center gap-1.5">
                <span>📅</span> Analytics Timeframe:
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'year', label: 'This Year' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
                      timeframe === tf.id
                        ? 'bg-[#D4AF6A] text-[#141210] font-bold'
                        : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#221F1C]'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-[#1A1816] border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Total Orders</span>
                <span className="text-xl font-bold font-mono text-[#F5EFE6]">{metrics.totalOrders}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Orders in period</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-amber-500 border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Awaiting Deposit</span>
                <span className="text-xl font-bold font-mono text-amber-500">{metrics.pendingAdvance}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Pending confirmation</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-indigo-400 border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">In Studio</span>
                <span className="text-xl font-bold font-mono text-indigo-400">{metrics.inStudio}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Calligraphy &amp; review</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-[#D4AF6A] border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Dispatched Air</span>
                <span className="text-xl font-bold font-mono text-[#D4AF6A]">{metrics.dispatched}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">With courier</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-emerald-500 border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Delivered</span>
                <span className="text-xl font-bold font-mono text-emerald-500">{metrics.delivered}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Safely delivered</span>
              </div>
              <div className="bg-[#1A1816] border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Gross Revenue</span>
                <span className="text-xl font-bold font-mono text-[#D4AF6A]">₹{metrics.grossRevenue}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">AOV: ₹{metrics.aov}</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-emerald-500 border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">Deposits</span>
                <span className="text-xl font-bold font-mono text-emerald-400">₹{metrics.depositsCollected}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Prepaid advances</span>
              </div>
              <div className="bg-[#1A1816] border-l-2 border-l-amber-500 border border-[#2D2722] p-3 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-[#A39684] block">COD Due</span>
                <span className="text-xl font-bold font-mono text-amber-400">₹{metrics.codOutstanding}</span>
                <span className="text-[10px] text-[#A39684] block mt-0.5">Collect at doorstep</span>
              </div>
            </div>

            {/* Controls Strip: Filters & Search */}
            <div className="bg-[#1A1816] p-4 rounded-xl border border-[#2D2722] flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="space-y-3 flex-1">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'All Orders', count: filterCounts.all },
                    { id: 'pending_payment', label: '⏳ Awaiting Deposit', count: filterCounts.pending_payment },
                    { id: 'confirmed', label: '💳 Confirmed', count: filterCounts.confirmed },
                    { id: 'in_studio', label: '🎨 Studio Crafting', count: filterCounts.in_studio },
                    { id: 'ready_to_ship', label: '📦 Ready to Ship', count: filterCounts.ready_to_ship },
                    { id: 'shipped', label: '🚚 Dispatched', count: filterCounts.shipped },
                    { id: 'delivered', label: '✅ Delivered', count: filterCounts.delivered },
                    { id: 'cancelled', label: '❌ Cancelled', count: filterCounts.cancelled },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(f.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                        statusFilter === f.id
                          ? 'bg-[#D4AF6A] text-[#141210] font-semibold'
                          : 'bg-[#0E0D0C] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Subtag chips */}
                <div className="flex flex-wrap gap-2 text-xs font-mono text-[#A39684]">
                  {[
                    { id: 'all', label: 'All Types' },
                    { id: 'gift', label: '🎁 Gift Packaging Only' },
                    { id: 'personalized', label: '✒️ Personalized Calligraphy' },
                    { id: 'ready_stock', label: '⚡ Ready-to-Ship Edition' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSubTagFilter(st.id);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md border text-[11px] transition-all ${
                        subTagFilter === st.id
                          ? 'border-[#D4AF6A] text-[#D4AF6A] bg-[#D4AF6A]/10'
                          : 'border-[#2D2722] hover:border-[#3A322A] text-[#A39684]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="w-full lg:w-72">
                <input
                  type="text"
                  placeholder="Search order #, customer, phone, AWB..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#1A1816] border border-[#2D2722] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141210] border-b border-[#2D2722] text-[#A39684] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Customer &amp; Delivery Address</th>
                      <th className="p-3.5">Frames &amp; Calligraphy</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Amount &amp; COD</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2722]">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-[#A39684]">
                          No orders match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((o) => {
                        const items = o.items || [];
                        const firstItem = items[0] || {};
                        const hasMore = items.length > 1;
                        const hasGift = items.some((i) => i.has_gift);
                        const imgSrc =
                          firstItem.product_image &&
                          (firstItem.product_image.startsWith('/') || firstItem.product_image.startsWith('http'))
                            ? firstItem.product_image
                            : `/${firstItem.product_image || 'design1.jpg'}`;

                        return (
                          <tr key={o.id} className="hover:bg-[#221F1C]/50 transition-colors">
                            {/* Order Ref */}
                            <td className="p-3.5 align-top whitespace-nowrap">
                              <span className="font-bold text-[#D4AF6A] text-sm block">
                                {o.order_number}
                              </span>
                              <span className="text-[10px] text-[#A39684] block mt-0.5">
                                {new Date(o.created_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* Customer & Address */}
                            <td className="p-3.5 align-top max-w-xs">
                              <strong className="text-[#F5EFE6] block text-xs">{o.customer_name}</strong>
                              <div className="text-[11px] text-[#A39684] mt-0.5 line-clamp-2">
                                {o.address} {o.city ? `, ${o.city}` : ''} {o.pincode ? `— PIN ${o.pincode}` : ''}
                              </div>
                              <div className="text-[10px] text-[#D4AF6A] mt-1 font-mono">
                                📞 +91 {o.phone}
                              </div>
                            </td>

                            {/* Frames & Calligraphy */}
                            <td className="p-3.5 align-top">
                              <div className="flex items-center gap-3">
                                <img
                                  src={imgSrc}
                                  alt="Frame Preview"
                                  className="w-12 h-14 object-cover rounded border border-[#2D2722] shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/design1.jpg';
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#F5EFE6] truncate max-w-[200px]">
                                    {firstItem.product_title || 'Custom Personalized Frame'}
                                  </div>
                                  {!firstItem.is_ready_made && firstItem.english_name && (
                                    <div className="text-[11px] text-[#D4AF6A] mt-0.5">
                                      {firstItem.english_name}
                                      {firstItem.arabic_name ? ` · ${firstItem.arabic_name}` : ''}
                                    </div>
                                  )}
                                  {firstItem.is_ready_made && (
                                    <div className="text-[10px] text-emerald-400 mt-0.5">
                                      ⚡ Ready-to-Ship Edition
                                    </div>
                                  )}
                                  {hasGift && (
                                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF6A]/10 text-[#D4AF6A] border border-[#D4AF6A]/30">
                                      🎁 Gift Box
                                    </span>
                                  )}
                                  {hasMore && (
                                    <div className="text-[10px] text-[#A39684] mt-0.5">
                                      (+{items.length - 1} more items)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Status Selector */}
                            <td className="p-3.5 align-top">
                              <select
                                value={o.status}
                                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                className="bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg px-2.5 py-1 text-xs font-mono outline-none text-[#F5EFE6]"
                              >
                                <option value="pending_payment">⏳ Awaiting Deposit</option>
                                <option value="confirmed">💳 Confirmed &amp; Paid</option>
                                <option value="processing">🏭 Processing</option>
                                <option value="personalization_review">🎨 Studio Review</option>
                                <option value="ready_to_ship">📦 Ready to Ship</option>
                                <option value="shipped">🚚 Dispatched</option>
                                <option value="out_for_delivery">🛵 Out for Delivery</option>
                                <option value="delivered">✅ Delivered</option>
                                <option value="cancelled">❌ Cancelled</option>
                                <option value="returned">🔄 Returned</option>
                              </select>
                            </td>

                            {/* Amount & COD */}
                            <td className="p-3.5 align-top text-right whitespace-nowrap">
                              <div className="font-bold text-sm text-[#F5EFE6]">
                                ₹{Math.round(o.total_amount)}
                              </div>
                              <div className="text-[10px] text-emerald-400">
                                ₹{Math.round(o.deposit_amount)} advance
                              </div>
                              <div className="text-[10px] text-amber-400">
                                ₹{Math.round(o.cod_amount)} COD
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 align-top text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  title="11-Template WhatsApp Hub"
                                  onClick={() => openWhatsAppModal(o)}
                                  className="w-8 h-8 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-sm transition-all"
                                >
                                  💬
                                </button>
                                <button
                                  type="button"
                                  title="View Order &amp; Production Checklist"
                                  onClick={() => openDetailModal(o)}
                                  className="w-8 h-8 rounded-lg bg-[#141210] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A] text-[#D4AF6A] flex items-center justify-center text-sm transition-all"
                                >
                                  👁️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-3.5 border-t border-[#2D2722] flex items-center justify-between text-xs text-[#A39684]">
                <div>
                  Showing {filteredOrders.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{' '}
                  {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-[#0E0D0C] border border-[#2D2722] rounded disabled:opacity-30 hover:border-[#D4AF6A] text-[#F5EFE6]"
                  >
                    &larr; Previous
                  </button>
                  <span className="px-2 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-[#0E0D0C] border border-[#2D2722] rounded disabled:opacity-30 hover:border-[#D4AF6A] text-[#F5EFE6]"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {/* =================================================================== */}
        {activeTab === 'customers' && (
          <div className="bg-[#1A1816] border border-[#2D2722] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141210] border-b border-[#2D2722] text-[#A39684] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Phone Number</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5">Lifetime Spend</th>
                    <th className="p-3.5">Delivery Address</th>
                    <th className="p-3.5 text-right">Direct Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2722]">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#A39684]">
                        Loading or no customers found.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c, i) => (
                      <tr key={i} className="hover:bg-[#221F1C]/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#F5EFE6]">{c.name}</td>
                        <td className="p-3.5 text-[#D4AF6A] font-mono">+91 {c.phone}</td>
                        <td className="p-3.5">{c.order_count || 1} orders</td>
                        <td className="p-3.5 font-bold text-[#D4AF6A]">₹{c.total_spent || 0}</td>
                        <td className="p-3.5 text-[#A39684] max-w-xs truncate">
                          {c.last_address || 'Address recorded on order'}
                        </td>
                        <td className="p-3.5 text-right">
                          <a
                            href={`https://wa.me/91${c.phone.replace(/\D/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs hover:bg-emerald-900/60 transition-all"
                          >
                            <span>💬</span> WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: REVIEWS MODERATION */}
        {/* =================================================================== */}
        {activeTab === 'reviews' && (
          <div className="bg-[#1A1816] border border-[#2D2722] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141210] border-b border-[#2D2722] text-[#A39684] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5">Comment</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2722]">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#A39684]">
                        Loading or no reviews to moderate.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#221F1C]/50 transition-colors">
                        <td className="p-3.5 font-bold text-[#F5EFE6]">{r.customer_name}</td>
                        <td className="p-3.5 text-[#D4AF6A]">{'★'.repeat(r.rating || 5)}</td>
                        <td className="p-3.5 text-[#A39684] max-w-sm">{r.review_text}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === 'approved'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : r.status === 'rejected'
                                ? 'bg-red-950 text-red-400 border border-red-500/40'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-[#A39684]">
                          {new Date(r.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleReviewAction(r.id, 'approve')}
                                className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 rounded hover:bg-emerald-900/60 text-[11px]"
                              >
                                Approve
                              </button>
                            )}
                            {r.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleReviewAction(r.id, 'reject')}
                                className="px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 text-amber-400 rounded hover:bg-amber-900/60 text-[11px]"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleReviewAction(r.id, 'delete')}
                              className="px-2.5 py-1 bg-red-950/60 border border-red-500/40 text-red-400 rounded hover:bg-red-900/60 text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ORDER DETAIL & PACKING SLIP MODAL */}
        {/* =================================================================== */}
        {isDetailModalOpen && selectedOrder && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <div
              className="bg-[#1A1816] border border-[#2D2722] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 text-left relative shadow-2xl space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute top-4 right-4 text-[#A39684] hover:text-[#F5EFE6] text-xl"
              >
                &times;
              </button>

              {/* Modal Header */}
              <div className="border-b border-[#2D2722] pb-4 flex items-center justify-between">
                <div>
                  <div className="font-serif text-2xl font-bold text-[#D4AF6A]">
                    ORDER {selectedOrder.order_number}
                  </div>
                  <div className="text-xs text-[#A39684] mt-0.5">
                    Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] text-xs font-mono text-[#D4AF6A] rounded-lg transition-all"
                >
                  🖨️ Print Packing Slip
                </button>
              </div>

              {/* Customer & Shipping Box */}
              <div className="bg-[#0E0D0C] border border-[#2D2722] rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF6A] mb-1">
                  Shipping &amp; Recipient Details
                </div>
                <div className="font-bold text-sm text-[#F5EFE6]">{selectedOrder.customer_name}</div>
                <div className="text-xs text-[#A39684] mt-1 leading-relaxed">
                  {selectedOrder.address}
                  <br />
                  {selectedOrder.city ? `${selectedOrder.city}, ` : ''}
                  {selectedOrder.state ? `${selectedOrder.state} — ` : ''}
                  <strong>PIN {selectedOrder.pincode}</strong>
                </div>
                <div className="text-xs font-mono text-[#D4AF6A] mt-2">
                  📞 Phone: <strong>+91 {selectedOrder.phone}</strong>
                </div>
              </div>

              {/* 10-Point Personalization Production Checklist */}
              <div className="bg-[#0E0D0C] border border-[#2D2722] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#2D2722] pb-2">
                  <span className="font-serif text-sm font-bold text-[#D4AF6A]">
                    ✦ 10-Point Personalization Production Checklist
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      CHECKLIST_STEPS.filter(
                        (s) => selectedOrder.production_checklist?.[s.id] === true
                      ).length === 10
                        ? 'text-emerald-400 font-bold'
                        : 'text-[#A39684]'
                    }`}
                  >
                    {
                      CHECKLIST_STEPS.filter(
                        (s) => selectedOrder.production_checklist?.[s.id] === true
                      ).length
                    }{' '}
                    / 10 Completed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {CHECKLIST_STEPS.map((s) => {
                    const isChecked = selectedOrder.production_checklist?.[s.id] === true;
                    return (
                      <label
                        key={s.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-[#141210] border-[#2D2722] text-[#A39684]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleChecklistToggle(selectedOrder.id, s.id, e.target.checked)
                          }
                          className="mt-0.5 accent-[#D4AF6A]"
                        />
                        <span className="text-[11px] leading-tight">{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#A39684] mb-2">
                  Order Items ({(selectedOrder.items || []).length})
                </div>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 bg-[#0E0D0C] border border-[#2D2722] rounded-xl"
                    >
                      <img
                        src={
                          item.product_image &&
                          (item.product_image.startsWith('/') || item.product_image.startsWith('http'))
                            ? item.product_image
                            : `/${item.product_image || 'design1.jpg'}`
                        }
                        alt="Item"
                        className="w-14 h-16 object-cover rounded-lg border border-[#2D2722] shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/design1.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-[#D4AF6A]">
                          {idx + 1}. {item.product_title}
                        </div>
                        {item.is_ready_made ? (
                          <div className="text-[11px] text-[#A39684] mt-0.5">
                            ⚡ Ready-to-Ship Edition · Ships in 24h
                          </div>
                        ) : (
                          <div className="text-xs text-[#F5EFE6] mt-0.5">
                            <strong>{item.english_name}</strong>
                            {item.arabic_name && ` · ${item.arabic_name}`}
                            <div className="text-[10px] text-[#A39684] mt-0.5">
                              Finish: {item.ink_style || 'Gold Foil'} · Font: {item.font_style || 'Royal'} · Size: A4
                            </div>
                          </div>
                        )}
                        {item.has_gift && (
                          <div className="mt-2 p-2 bg-[#D4AF6A]/10 border-l-2 border-[#D4AF6A] rounded text-[11px] text-[#F5EFE6]">
                            🎁 <strong>Gift Card (+₹69)</strong>: To {item.gift_to || 'Recipient'} from{' '}
                            {item.gift_from || 'Sender'}
                            <br />
                            <em className="text-[#A39684]">"{item.gift_message || 'Best wishes!'}"</em>
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-sm text-[#F5EFE6] shrink-0">
                        ₹{Math.round(item.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier Dispatch & Tracking Box */}
              <div className="bg-[#0E0D0C] border border-[#2D2722] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-[#D4AF6A]">
                    📦 Courier Dispatch &amp; Tracking (Manually Managed)
                  </span>
                  <span className="text-[10px] font-mono text-[#A39684]">
                    AWB Duplicate Protection Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={modalCourier}
                    onChange={(e) => setModalCourier(e.target.value)}
                    className="p-2 bg-[#141210] border border-[#2D2722] rounded text-xs font-mono text-[#F5EFE6] outline-none"
                  >
                    <option value="BlueDart Air">BlueDart Air Express</option>
                    <option value="Delhivery Express">Delhivery Express</option>
                    <option value="DTDC Priority">DTDC Priority</option>
                    <option value="XpressBees">XpressBees Surface</option>
                    <option value="India Post">India Post Speed Post</option>
                    <option value="Shadowfax">Shadowfax Air</option>
                    <option value="Other">Other Courier...</option>
                  </select>

                  <input
                    type="text"
                    placeholder="AWB / Tracking Number"
                    value={modalAwb}
                    onChange={(e) => setModalAwb(e.target.value)}
                    className="p-2 bg-[#141210] border border-[#2D2722] rounded text-xs font-mono text-[#F5EFE6] outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveShipping(false)}
                    className="px-4 py-2 bg-[#D4AF6A] text-[#141210] font-bold rounded text-xs font-mono hover:bg-[#E5C384] transition-all"
                  >
                    Save AWB
                  </button>
                </div>

                {modalCourier === 'Other' && (
                  <input
                    type="text"
                    placeholder="Specify courier name..."
                    value={modalCustomCourier}
                    onChange={(e) => setModalCustomCourier(e.target.value)}
                    className="w-full p-2 bg-[#141210] border border-[#2D2722] rounded text-xs font-mono text-[#F5EFE6] outline-none"
                  />
                )}

                {awbWarning && (
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono">
                    ⚠️ {awbWarning}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#2D2722]">
                  <div className="text-xs font-mono text-[#A39684]">
                    {selectedOrder.tracking_url ? (
                      <a
                        href={selectedOrder.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D4AF6A] hover:underline"
                      >
                        🔗 Open Courier Tracking Page &rarr;
                      </a>
                    ) : (
                      'AWB link generated automatically on save.'
                    )}
                  </div>

                  {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' ? (
                    <button
                      type="button"
                      onClick={() => handleSaveShipping(true)}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold transition-all"
                    >
                      🚚 Mark Shipped &amp; Record Timestamp
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      ✓ Dispatched at{' '}
                      {new Date(selectedOrder.dispatched_at || selectedOrder.created_at).toLocaleDateString(
                        'en-IN'
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* WHATSAPP ASSISTED HUB MODAL */}
        {/* =================================================================== */}
        {whatsAppOrder && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setWhatsAppOrder(null)}
          >
            <div
              className="bg-[#1A1816] border border-[#2D2722] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 text-left relative shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setWhatsAppOrder(null)}
                className="absolute top-4 right-4 text-[#A39684] hover:text-[#F5EFE6] text-xl"
              >
                &times;
              </button>

              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <div className="font-serif text-lg font-bold text-[#D4AF6A]">
                    WhatsApp Customer Communication Hub
                  </div>
                  <div className="text-xs text-[#A39684]">
                    Order {whatsAppOrder.order_number} · Customer: {whatsAppOrder.customer_name} (+91{' '}
                    {whatsAppOrder.phone})
                  </div>
                </div>
              </div>

              {/* Template list */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF6A] mb-1.5">
                  Select Operational Message Template:
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-[#2D2722] rounded-lg p-2 bg-[#0E0D0C]">
                  {WA_TEMPLATES.map((tmpl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setWhatsAppTemplateIdx(idx)}
                      className={`p-2 rounded flex items-center justify-between text-xs font-mono cursor-pointer transition-all ${
                        whatsAppTemplateIdx === idx
                          ? 'bg-[#D4AF6A]/20 text-[#D4AF6A] border border-[#D4AF6A]/40'
                          : 'text-[#A39684] hover:bg-[#1A1816] hover:text-[#F5EFE6]'
                      }`}
                    >
                      <span>{tmpl.name}</span>
                      <span className="text-[10px] text-[#D4AF6A]">Select &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                  Live Message Preview:
                </div>
                <div className="p-3.5 bg-[#0E0D0C] border border-[#2D2722] rounded-lg text-xs font-mono whitespace-pre-line text-[#F5EFE6] max-h-40 overflow-y-auto leading-relaxed">
                  {WA_TEMPLATES[whatsAppTemplateIdx].generate(whatsAppOrder)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#A39684]">
                  * Opens official WhatsApp Web / Mobile app directly
                </span>
                <button
                  type="button"
                  onClick={handleLaunchWhatsApp}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5"
                >
                  🚀 Open in WhatsApp &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayoutClient>
    </AdminGuard>
  );
}
