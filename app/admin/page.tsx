'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'reviews'>('dashboard');
  const [orders, setOrders] = useState<AdminOrderRecord[]>(DEMO_ORDERS);
  const [customers, setCustomers] = useState<CustomerProfileAdmin[]>([]);
  const [reviews, setReviews] = useState<ReviewAdminItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [inventorySummary, setInventorySummary] = useState<any>({
    total_products: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    healthy_count: 0,
  });

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

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAnalyticsData(json);
        }
      }
    } catch (err) {
      console.warn('Analytics fetch note:', err);
    }
  };

  const fetchInventorySummary = async () => {
    try {
      const res = await fetch('/api/admin/inventory');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.summary) {
          setInventorySummary(json.summary);
        }
      }
    } catch (err) {
      console.warn('Inventory fetch note:', err);
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

  // Phase 3: Marketing CMS Summary
  const [marketingSummary, setMarketingSummary] = useState({
    announcementActive: true,
    announcementBadge: 'FESTIVE GIFTING',
    activeCampaigns: 0,
    activeCampaignName: 'None',
    pendingReviews: 0,
    approvedReviews: 3,
    galleryItemsCount: 4,
  });

  const fetchMarketingSummary = async () => {
    try {
      const [hpRes, revRes, campRes, galRes] = await Promise.allSettled([
        fetch('/api/admin/homepage'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/campaigns'),
        fetch('/api/admin/customer-gallery'),
      ]);

      let annActive = true;
      let annBadge = 'FESTIVE GIFTING';
      if (hpRes.status === 'fulfilled' && hpRes.value.ok) {
        const hpJson = await hpRes.value.json();
        if (hpJson.sections?.announcement_bar) {
          annActive =
            hpJson.sections.announcement_bar.is_active !== false &&
            hpJson.sections.announcement_bar.content?.enabled !== false;
          annBadge = hpJson.sections.announcement_bar.content?.badge || 'FESTIVE GIFTING';
        }
      }

      let pendRevs = 0;
      let appRevs = 0;
      if (revRes.status === 'fulfilled' && revRes.value.ok) {
        const revJson = await revRes.value.json();
        if (Array.isArray(revJson.reviews)) {
          pendRevs = revJson.reviews.filter((r: any) => r.status === 'pending').length;
          appRevs = revJson.reviews.filter((r: any) => r.status === 'approved').length;
        }
      }

      let actCamps = 0;
      let campName = 'None';
      if (campRes.status === 'fulfilled' && campRes.value.ok) {
        const campJson = await campRes.value.json();
        if (Array.isArray(campJson.campaigns)) {
          const activeOnes = campJson.campaigns.filter((c: any) => c.is_active !== false);
          actCamps = activeOnes.length;
          if (activeOnes.length > 0) campName = activeOnes[0].name;
        }
      }

      let galCount = 4;
      if (galRes.status === 'fulfilled' && galRes.value.ok) {
        const galJson = await galRes.value.json();
        if (Array.isArray(galJson.items)) {
          galCount = galJson.items.length;
        }
      }

      setMarketingSummary({
        announcementActive: annActive,
        announcementBadge: annBadge,
        activeCampaigns: actCamps,
        activeCampaignName: campName,
        pendingReviews: pendRevs,
        approvedReviews: appRevs,
        galleryItemsCount: galCount,
      });
    } catch (e) {
      console.warn('Marketing summary fetch note:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
    fetchInventorySummary();
    fetchMarketingSummary();
  }, [timeframe]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'orders' || tabParam === 'customers' || tabParam === 'reviews') {
        setActiveTab(tabParam);
      }
    }
  }, []);

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
        <div className="flex items-center gap-2 border-b border-[#2D2722] pb-3 mb-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow-md'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            📊 Operations Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
              activeTab === 'orders'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow-md'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            📦 Orders &amp; Dispatch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
              activeTab === 'customers'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow-md'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            👥 Customers Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
              activeTab === 'reviews'
                ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow-md'
                : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
            }`}
          >
            ⭐ Reviews Moderation
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 0: OPERATIONAL COMMAND CENTER DASHBOARD */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Analytics Timeframe Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A1816] p-4 rounded-xl border border-[#2D2722]">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#F5EFE6]">Operations Command Center</h2>
                <p className="text-xs text-[#A39684] mt-0.5 font-mono">
                  Live business metrics, fulfillment queues, and inventory health
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      timeframe === tf.id
                        ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow'
                        : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#221F1C]'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#141210] p-5 rounded-xl border border-[#2D2722]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A39684] block">Total Order Value</span>
                <span className="text-2xl font-bold font-mono text-[#F5EFE6] block mt-1">
                  ₹{analyticsData?.total_revenue ?? metrics.grossRevenue}
                </span>
                <span className="text-[11px] font-mono text-[#A39684] block mt-1">
                  {analyticsData?.total_orders ?? metrics.totalOrders} total orders placed
                </span>
              </div>

              <div className="bg-[#141210] p-5 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">Advance Deposits Paid</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                  ₹{analyticsData?.deposits_collected ?? metrics.depositsCollected}
                </span>
                <span className="text-[11px] font-mono text-[#A39684] block mt-1">
                  Verified via Razorpay TEST
                </span>
              </div>

              <div className="bg-[#141210] p-5 rounded-xl border border-amber-500/30">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block">Outstanding COD Due</span>
                <span className="text-2xl font-bold font-mono text-amber-400 block mt-1">
                  ₹{analyticsData?.cod_outstanding ?? metrics.codOutstanding}
                </span>
                <span className="text-[11px] font-mono text-[#A39684] block mt-1">
                  Collect upon doorstep delivery
                </span>
              </div>

              <div className="bg-[#141210] p-5 rounded-xl border border-[#2D2722]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#A39684] block">Active In-Flight Orders</span>
                <span className="text-2xl font-bold font-mono text-[#D4AF6A] block mt-1">
                  {analyticsData?.active_orders ?? (metrics.inStudio + metrics.pendingAdvance + metrics.dispatched)}
                </span>
                <span className="text-[11px] font-mono text-[#A39684] block mt-1">
                  In production or delivery
                </span>
              </div>
            </div>

            {/* Order Lifecycle Pipeline Visualizer */}
            <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">Order Lifecycle Pipeline</h3>
                  <p className="text-xs font-mono text-[#A39684] mt-0.5">Real-time status progression distribution across all active orders</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-mono text-[#D4AF6A] hover:underline flex items-center gap-1"
                >
                  Open Orders Manager →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
                {[
                  { label: 'Pending', count: analyticsData?.pipeline?.pending ?? metrics.pendingAdvance, color: 'text-amber-400', border: 'border-amber-500/30', filter: 'pending_payment' },
                  { label: 'Confirmed', count: analyticsData?.pipeline?.confirmed ?? 0, color: 'text-emerald-400', border: 'border-emerald-500/30', filter: 'confirmed' },
                  { label: 'Studio Review', count: analyticsData?.pipeline?.studio_review ?? orders.filter(o => o.status === 'personalization_review').length, color: 'text-indigo-400', border: 'border-indigo-500/40', badge: 'Action', filter: 'personalization_review' },
                  { label: 'In Production', count: analyticsData?.pipeline?.in_production ?? metrics.inStudio, color: 'text-purple-400', border: 'border-purple-500/30', filter: 'in_production' },
                  { label: 'Ready to Ship', count: analyticsData?.pipeline?.ready_to_ship ?? orders.filter(o => o.status === 'ready_to_ship').length, color: 'text-cyan-400', border: 'border-cyan-500/40', badge: 'Ready', filter: 'ready_to_ship' },
                  { label: 'In Transit', count: analyticsData?.pipeline?.in_transit ?? metrics.dispatched, color: 'text-teal-400', border: 'border-teal-500/30', filter: 'shipped' },
                  { label: 'Delivered', count: analyticsData?.pipeline?.delivered ?? metrics.delivered, color: 'text-green-400', border: 'border-green-500/30', filter: 'delivered' },
                  { label: 'Cancelled', count: analyticsData?.pipeline?.cancelled ?? 0, color: 'text-red-400', border: 'border-red-500/30', filter: 'cancelled' },
                ].map((stage, idx) => (
                  <Link
                    key={idx}
                    href={`/admin/orders?status=${stage.filter}`}
                    className={`bg-[#1A1816] hover:bg-[#221F1C] p-3 rounded-lg border ${stage.border} transition-all flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#A39684] truncate">{stage.label}</span>
                      {stage.badge && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </div>
                    <span className={`text-xl font-bold mt-2 ${stage.color}`}>{stage.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Action Queues: Needs Review & Ready to Ship */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ⚡ Urgent Personalization Review Queue */}
              <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-base font-bold text-[#F5EFE6] flex items-center gap-2">
                      <span>⚡</span> Needs Personalization Review
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                      {orders.filter((o) => o.status === 'personalization_review').length} in queue
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#A39684] mb-4">
                    Orders requiring master artisan inspection of English/Arabic spelling before frame creation.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    {orders
                      .filter((o) => o.status === 'personalization_review')
                      .slice(0, 3)
                      .map((order) => {
                        const item = (order.items || [])[0] || {};
                        return (
                          <div
                            key={order.id}
                            className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-bold text-[#F5EFE6]">
                                {order.order_number} • {order.customer_name}
                              </div>
                              <div className="text-[11px] text-[#D4AF6A] mt-0.5">
                                {item.english_name || '—'} {item.arabic_name ? `(${item.arabic_name})` : ''}
                              </div>
                            </div>
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="px-3 py-1.5 bg-[#141210] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded text-[11px] font-semibold transition-all shrink-0"
                            >
                              Review →
                            </Link>
                          </div>
                        );
                      })}
                    {orders.filter((o) => o.status === 'personalization_review').length === 0 && (
                      <div className="text-[#736B63] italic py-4 text-center">
                        ✓ No orders pending personalization review.
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/admin/orders?workflow=studio_review"
                  className="inline-block mt-4 text-xs font-mono text-[#D4AF6A] hover:underline"
                >
                  View all in Studio Review →
                </Link>
              </div>

              {/* 📦 Ready for Dispatch Handover Queue */}
              <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-base font-bold text-[#F5EFE6] flex items-center gap-2">
                      <span>📦</span> Ready for Dispatch Handover
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                      {orders.filter((o) => o.status === 'ready_to_ship').length} ready
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#A39684] mb-4">
                    Framed, verified by 10-point checklist, and packaged for courier handover.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    {orders
                      .filter((o) => o.status === 'ready_to_ship')
                      .slice(0, 3)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-bold text-[#F5EFE6]">
                              {order.order_number} • {order.customer_name}
                            </div>
                            <div className="text-[11px] text-[#A39684] mt-0.5">
                              {[order.city, order.pincode].filter(Boolean).join(', ') || 'Address ready'}
                            </div>
                          </div>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="px-3 py-1.5 bg-[#141210] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded text-[11px] font-semibold transition-all shrink-0"
                          >
                            Dispatch →
                          </Link>
                        </div>
                      ))}
                    {orders.filter((o) => o.status === 'ready_to_ship').length === 0 && (
                      <div className="text-[#736B63] italic py-4 text-center">
                        ✓ All packaged frames have been handed over to couriers.
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/admin/orders?workflow=ready_dispatch"
                  className="inline-block mt-4 text-xs font-mono text-[#D4AF6A] hover:underline"
                >
                  View all ready for dispatch →
                </Link>
              </div>
            </div>

            {/* 2-Column: Inventory Health & Quick Operations Portals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inventory Health Monitor */}
              <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6] flex items-center gap-2">
                    <span>🏷️</span> Inventory Health Monitor
                  </h3>
                  <Link
                    href="/admin/inventory"
                    className="text-xs font-mono text-[#D4AF6A] hover:underline"
                  >
                    Manage Stock →
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono text-center mb-4">
                  <div className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722]">
                    <div className="text-[10px] text-[#A39684] uppercase">Catalog Items</div>
                    <div className="text-lg font-bold text-[#F5EFE6] mt-1">{inventorySummary.total_products}</div>
                  </div>
                  <div className="bg-[#1A1816] p-3 rounded-lg border border-amber-500/30">
                    <div className="text-[10px] text-amber-400 uppercase">Low Stock (&le;5)</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">{inventorySummary.low_stock_count}</div>
                  </div>
                  <div className="bg-[#1A1816] p-3 rounded-lg border border-red-500/30">
                    <div className="text-[10px] text-red-400 uppercase">Out of Stock</div>
                    <div className="text-lg font-bold text-red-400 mt-1">{inventorySummary.out_of_stock_count}</div>
                  </div>
                </div>

                <p className="text-xs font-mono text-[#A39684]">
                  Live synchronization with Supabase products table and atomic movement ledger.
                </p>
              </div>

              {/* Operational Hub Fast Links */}
              <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
                <h3 className="font-serif text-base font-bold text-[#F5EFE6] mb-4 flex items-center gap-2">
                  <span>⚡</span> Quick Management Shortcuts
                </h3>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <Link
                    href="/admin/orders"
                    className="p-3 bg-[#1A1816] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A]/40 rounded-lg transition-all flex items-center gap-2.5"
                  >
                    <span className="text-base">📦</span>
                    <div>
                      <div className="font-bold text-[#F5EFE6]">Orders Manager</div>
                      <div className="text-[10px] text-[#A39684]">Search &amp; filters</div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/customers"
                    className="p-3 bg-[#1A1816] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A]/40 rounded-lg transition-all flex items-center gap-2.5"
                  >
                    <span className="text-base">👥</span>
                    <div>
                      <div className="font-bold text-[#F5EFE6]">Customer CRM</div>
                      <div className="text-[10px] text-[#A39684]">LTV &amp; profiles</div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/inventory"
                    className="p-3 bg-[#1A1816] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A]/40 rounded-lg transition-all flex items-center gap-2.5"
                  >
                    <span className="text-base">🏷️</span>
                    <div>
                      <div className="font-bold text-[#F5EFE6]">Inventory Stock</div>
                      <div className="text-[10px] text-[#A39684]">Levels &amp; logs</div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/activity"
                    className="p-3 bg-[#1A1816] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A]/40 rounded-lg transition-all flex items-center gap-2.5"
                  >
                    <span className="text-base">📜</span>
                    <div>
                      <div className="font-bold text-[#F5EFE6]">Audit &amp; Activity</div>
                      <div className="text-[10px] text-[#A39684]">Event ledger</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Marketing CMS & Conversion Overview Widget */}
            <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                    Marketing CMS &amp; Storefront Controls
                  </h3>
                  <p className="text-xs font-mono text-[#A39684] mt-0.5">
                    Live announcement bar, active promotions, and customer social proof
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/homepage"
                    className="px-3 py-1.5 bg-[#1A1816] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-mono transition-all"
                  >
                    Manage Homepage →
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                {/* 1. Announcement Bar */}
                <div className="bg-[#1A1816] p-4 rounded-lg border border-[#2D2722] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-[#A39684]">Announcement Bar</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          marketingSummary.announcementActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-700/30 text-[#A39684]'
                        }`}
                      >
                        {marketingSummary.announcementActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="font-bold text-[#F5EFE6] mt-2 truncate">
                      {marketingSummary.announcementBadge}
                    </div>
                    <div className="text-[11px] text-[#A39684] mt-0.5">Top notification strip</div>
                  </div>
                  <Link
                    href="/admin/homepage"
                    className="text-[11px] text-[#D4AF6A] hover:underline mt-3 inline-block"
                  >
                    Edit Announcement →
                  </Link>
                </div>

                {/* 2. Reviews Moderation */}
                <div className="bg-[#1A1816] p-4 rounded-lg border border-[#2D2722] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-[#A39684]">Customer Reviews</span>
                      {marketingSummary.pendingReviews > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 animate-pulse">
                          {marketingSummary.pendingReviews} PENDING
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          CLEARED
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-[#F5EFE6] mt-2">
                      {marketingSummary.approvedReviews} Verified Reviews
                    </div>
                    <div className="text-[11px] text-[#A39684] mt-0.5">
                      4.9★ Average buyer rating
                    </div>
                  </div>
                  <Link
                    href="/admin/reviews"
                    className="text-[11px] text-[#D4AF6A] hover:underline mt-3 inline-block"
                  >
                    Moderate Reviews →
                  </Link>
                </div>

                {/* 3. Customer Gallery / Lookbook */}
                <div className="bg-[#1A1816] p-4 rounded-lg border border-[#2D2722] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-[#A39684]">Customer Lookbook</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D4AF6A]/20 text-[#D4AF6A]">
                        {marketingSummary.galleryItemsCount} PHOTOS
                      </span>
                    </div>
                    <div className="font-bold text-[#F5EFE6] mt-2">Real Finished Works</div>
                    <div className="text-[11px] text-[#A39684] mt-0.5">Interactive lightbox lookbook</div>
                  </div>
                  <Link
                    href="/admin/customer-gallery"
                    className="text-[11px] text-[#D4AF6A] hover:underline mt-3 inline-block"
                  >
                    Manage Gallery →
                  </Link>
                </div>

                {/* 4. Promotional Campaigns */}
                <div className="bg-[#1A1816] p-4 rounded-lg border border-[#2D2722] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-[#A39684]">Active Promotion</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          marketingSummary.activeCampaigns > 0
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-zinc-700/30 text-[#A39684]'
                        }`}
                      >
                        {marketingSummary.activeCampaigns > 0 ? 'RUNNING' : 'DEFAULT'}
                      </span>
                    </div>
                    <div className="font-bold text-[#F5EFE6] mt-2 truncate">
                      {marketingSummary.activeCampaignName}
                    </div>
                    <div className="text-[11px] text-[#A39684] mt-0.5">Storefront product badges</div>
                  </div>
                  <Link
                    href="/admin/campaigns"
                    className="text-[11px] text-[#D4AF6A] hover:underline mt-3 inline-block"
                  >
                    Configure Campaigns →
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F5EFE6]">Recent Orders Preview</h3>
                  <p className="text-xs font-mono text-[#A39684] mt-0.5">Most recent incoming customer commissions</p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-xs font-mono text-[#D4AF6A] hover:underline"
                >
                  View All {orders.length} Orders →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-[#1A1816] text-[#A39684] border-b border-[#2D2722] uppercase">
                      <th className="p-3 font-semibold">Order</th>
                      <th className="p-3 font-semibold">Customer</th>
                      <th className="p-3 font-semibold">Amount</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2722]">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-[#1E1B18]/60 transition-colors">
                        <td className="p-3 font-bold text-[#D4AF6A]">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            {order.order_number || `#${order.id.slice(0, 8)}`}
                          </Link>
                        </td>
                        <td className="p-3 text-[#F5EFE6]">
                          {order.customer_name} ({order.phone})
                        </td>
                        <td className="p-3 font-bold text-[#F5EFE6]">
                          ₹{order.total_amount ?? 0}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1E1B18] text-[#D4AF6A] border border-[#2D2722]">
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="px-2.5 py-1 bg-[#1E1B18] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] rounded border border-[#2D2722] text-[11px] transition-all"
                          >
                            Inspect →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
                                <option value="pending_advance">⏳ Awaiting Deposit</option>
                                <option value="pending_payment">⏳ Awaiting Deposit (Legacy)</option>
                                <option value="advance_paid">💳 Deposit Paid</option>
                                <option value="confirmed">💳 Confirmed &amp; Paid (Legacy)</option>
                                <option value="in_production">🏭 In Production</option>
                                <option value="processing">🏭 Processing (Legacy)</option>
                                <option value="personalization_review">🎨 Studio Review</option>
                                <option value="ready_to_ship">📦 Ready to Ship</option>
                                <option value="dispatched">🚚 Dispatched with Courier</option>
                                <option value="shipped">🚚 Shipped (Legacy)</option>
                                <option value="out_for_delivery">🛵 Out for Delivery</option>
                                <option value="delivered">✅ Delivered &amp; Completed</option>
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
                            <em className="text-[#A39684]">&quot;{item.gift_message || 'Best wishes!'}&quot;</em>
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
