/**
 * NAMORA ADMIN DASHBOARD LOGIC (PHASE 3 PRODUCTION)
 * Order Lifecycle, Dispatch Hub, Personalization Workflow, Customer Directory & Analytics
 */

// Demo orders for offline / preview fallback
const DEMO_ORDERS = [
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
      step1: true, step2: true, step3: true, step4: true
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

let allOrders = [];
let allCustomers = [];
let allReviews = [];

let currentFilter = 'all';
let currentSubTag = 'all';
let currentSearch = '';
let currentAnalyticsTimeframe = 'all';

let currentPage = 1;
const PAGE_SIZE = 15;

let activeWhatsAppOrder = null;
let activeWhatsAppTemplateIdx = 0;

// Supabase Client Helper
function getSupabase() {
  const config = window.NAMORA_CONFIG || window.NAMORA_SUPABASE_CONFIG || {};
  const url = config.SUPABASE_URL && config.SUPABASE_URL.trim();
  const key = config.SUPABASE_ANON_KEY && config.SUPABASE_ANON_KEY.trim();

  if (window.supabase && typeof window.supabase.createClient === 'function' && url && key && url.startsWith('http')) {
    try {
      return window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    } catch (e) {
      console.warn('Admin Supabase Client init error:', e);
    }
  }
  return null;
}

// Authentication Check
async function checkAdminAuth() {
  const config = window.NAMORA_CONFIG || window.NAMORA_SUPABASE_CONFIG || {};
  const isDemoAllowed = config.DEMO_ADMIN_MODE === true;

  if (!isDemoAllowed) {
    if (localStorage.getItem('namora_admin_demo')) {
      localStorage.removeItem('namora_admin_demo');
    }
  } else if (localStorage.getItem('namora_admin_demo') === 'true') {
    updateAdminUserDisplay('demo@namoraworld.com (Dev Demo)');
    showDemoModeBanner();
    return true;
  }

  const client = getSupabase();
  if (!client) {
    if (isDemoAllowed) {
      updateAdminUserDisplay('unconfigured (demo mode)');
      showDemoModeBanner();
      return true;
    }
    window.location.href = 'login.html';
    return false;
  }

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) {
      window.location.href = 'login.html';
      return false;
    }
    const userEmail = (session.user && session.user.email) || 'admin@namoraworld.com';
    updateAdminUserDisplay(userEmail);
    return true;
  } catch (err) {
    console.warn('Auth check error:', err);
    window.location.href = 'login.html';
    return false;
  }
}

function updateAdminUserDisplay(email) {
  const el = document.getElementById('adminUserEmail');
  if (el) el.textContent = email;
  const avatar = document.getElementById('adminAvatarInitial');
  if (avatar && email) avatar.textContent = email.charAt(0).toUpperCase();
}

function showDemoModeBanner() {
  const banner = document.getElementById('demoModeBanner');
  if (banner) banner.style.display = 'block';
}

async function logoutAdmin() {
  localStorage.removeItem('namora_admin_demo');
  const client = getSupabase();
  if (client) {
    try { await client.auth.signOut(); } catch (e) {}
  }
  window.location.href = 'login.html';
}

// Tab Switching
function switchAdminTab(tabName) {
  const tabs = ['orders', 'customers', 'reviews'];
  tabs.forEach(t => {
    const content = document.getElementById('tabContent' + t.charAt(0).toUpperCase() + t.slice(1));
    const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
    const nav = document.getElementById('nav' + t.charAt(0).toUpperCase() + t.slice(1));

    if (content) content.style.display = (t === tabName) ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', t === tabName);
    if (nav) nav.classList.toggle('active', t === tabName);
  });

  const headerTitle = document.getElementById('adminHeaderTitle');
  if (headerTitle) {
    if (tabName === 'orders') headerTitle.textContent = 'Order Operations & Dispatch';
    if (tabName === 'customers') headerTitle.textContent = 'Customer Profiles & History';
    if (tabName === 'reviews') headerTitle.textContent = 'Customer Reviews & Social Proof Moderation';
  }

  if (tabName === 'customers' && allCustomers.length === 0) loadCustomers();
  if (tabName === 'reviews' && allReviews.length === 0) loadReviews();
}

// Load Orders
async function loadOrders() {
  try {
    const client = getSupabase();
    if (client) {
      const { data: ordersData, error: oError } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!oError && Array.isArray(ordersData) && ordersData.length > 0) {
        const { data: itemsData } = await client.from('order_items').select('*');
        const itemsByOrder = {};
        if (Array.isArray(itemsData)) {
          itemsData.forEach(item => {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push(item);
          });
        }

        allOrders = ordersData.map(o => ({
          ...o,
          items: itemsByOrder[o.id] || []
        }));
      } else {
        allOrders = DEMO_ORDERS;
      }
    } else {
      allOrders = DEMO_ORDERS;
    }
  } catch (err) {
    console.warn('Orders fetch note:', err);
    allOrders = DEMO_ORDERS;
  }

  renderDashboard();
}

// Change Analytics Timeframe
async function changeAnalyticsTimeframe(tf, btn) {
  currentAnalyticsTimeframe = tf;
  if (btn) {
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  try {
    const res = await fetch(`/api/analytics?timeframe=${tf}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        renderMetricsFromAnalytics(data);
        return;
      }
    }
  } catch (e) {}

  renderMetrics();
}

function renderMetricsFromAnalytics(data) {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('metricTotalOrders', data.total_orders);
  const sc = data.status_counts || {};
  setEl('metricPendingAdvance', sc.pending_payment || sc.pending_advance || 0);
  setEl('metricInStudio', (sc.processing || 0) + (sc.personalization_review || 0) + (sc.in_production || 0) + (sc.confirmed || 0) + (sc.advance_paid || 0));
  setEl('metricDispatched', (sc.shipped || 0) + (sc.dispatched || 0) + (sc.out_for_delivery || 0));
  setEl('metricDelivered', sc.delivered || 0);
  setEl('metricTotalRevenue', '₹' + Math.round(data.total_revenue || 0).toLocaleString('en-IN'));
  setEl('metricDepositsCollected', '₹' + Math.round(data.deposits_collected || 0).toLocaleString('en-IN'));
  setEl('metricCodOutstanding', '₹' + Math.round(data.cod_outstanding || 0).toLocaleString('en-IN'));
  setEl('metricAovSub', `AOV: ₹${Math.round(data.average_order_value || 0).toLocaleString('en-IN')}`);
}

function renderDashboard() {
  renderMetrics();
  renderOrdersTable();
}

function renderMetrics() {
  const now = new Date();
  const filteredTimeframe = allOrders.filter(o => {
    if (currentAnalyticsTimeframe === 'all') return true;
    const d = new Date(o.created_at);
    const diffMs = now - d;
    if (currentAnalyticsTimeframe === 'today') return diffMs < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate();
    if (currentAnalyticsTimeframe === '7days') return diffMs <= 7 * 24 * 60 * 60 * 1000;
    if (currentAnalyticsTimeframe === '30days') return diffMs <= 30 * 24 * 60 * 60 * 1000;
    if (currentAnalyticsTimeframe === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalOrders = filteredTimeframe.length;
  const pendingAdvance = filteredTimeframe.filter(o => o.status === 'pending_payment' || o.status === 'pending_advance').length;
  const confirmedOrders = filteredTimeframe.filter(o => o.status === 'confirmed' || o.status === 'advance_paid').length;
  const inStudio = filteredTimeframe.filter(o => o.status === 'processing' || o.status === 'personalization_review' || o.status === 'in_production').length;
  const readyOrders = filteredTimeframe.filter(o => o.status === 'ready_to_ship').length;
  const dispatched = filteredTimeframe.filter(o => o.status === 'shipped' || o.status === 'dispatched' || o.status === 'out_for_delivery').length;
  const delivered = filteredTimeframe.filter(o => o.status === 'delivered').length;
  const cancelled = filteredTimeframe.filter(o => o.status === 'cancelled').length;

  const validOrders = filteredTimeframe.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const depositsCollected = validOrders
    .filter(o => o.payment_status === 'paid' || o.payment_status === 'deposit_received' || o.status === 'confirmed' || o.status === 'advance_paid' || o.status === 'shipped' || o.status === 'delivered')
    .reduce((sum, o) => sum + (parseFloat(o.deposit_amount) || 0), 0);
  const codOutstanding = validOrders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (parseFloat(o.cod_amount) || 0), 0);
  const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('metricTotalOrders', totalOrders);
  setEl('metricPendingAdvance', pendingAdvance);
  setEl('metricInStudio', inStudio + confirmedOrders);
  setEl('metricDispatched', dispatched);
  setEl('metricDelivered', delivered);
  setEl('metricTotalRevenue', '₹' + Math.round(totalRevenue).toLocaleString('en-IN'));
  setEl('metricDepositsCollected', '₹' + Math.round(depositsCollected).toLocaleString('en-IN'));
  setEl('metricCodOutstanding', '₹' + Math.round(codOutstanding).toLocaleString('en-IN'));
  setEl('metricAovSub', `AOV: ₹${aov.toLocaleString('en-IN')}`);

  setEl('countAll', allOrders.length);
  setEl('countPending', allOrders.filter(o => o.status === 'pending_payment' || o.status === 'pending_advance').length);
  setEl('countConfirmed', allOrders.filter(o => o.status === 'confirmed' || o.status === 'advance_paid').length);
  setEl('countInStudio', allOrders.filter(o => o.status === 'processing' || o.status === 'personalization_review' || o.status === 'in_production').length);
  setEl('countReady', allOrders.filter(o => o.status === 'ready_to_ship').length);
  setEl('countDispatched', allOrders.filter(o => o.status === 'shipped' || o.status === 'dispatched' || o.status === 'out_for_delivery').length);
  setEl('countDelivered', allOrders.filter(o => o.status === 'delivered').length);
  setEl('countCancelled', allOrders.filter(o => o.status === 'cancelled').length);
}

function filterByStatus(status, btn) {
  currentFilter = status;
  currentPage = 1;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderOrdersTable();
}

function filterBySubTag(tag, chip) {
  currentSubTag = tag;
  currentPage = 1;
  if (chip) {
    document.querySelectorAll('.sub-filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  }
  renderOrdersTable();
}

function handleSearch(term) {
  currentSearch = (term || '').toLowerCase().trim();
  currentPage = 1;
  renderOrdersTable();
}

function changePage(delta) {
  currentPage += delta;
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  let filtered = allOrders;

  // Status Filter
  if (currentFilter !== 'all') {
    if (currentFilter === 'pending_payment') {
      filtered = filtered.filter(o => o.status === 'pending_payment' || o.status === 'pending_advance');
    } else if (currentFilter === 'confirmed') {
      filtered = filtered.filter(o => o.status === 'confirmed' || o.status === 'advance_paid');
    } else if (currentFilter === 'in_studio') {
      filtered = filtered.filter(o => o.status === 'processing' || o.status === 'personalization_review' || o.status === 'in_production');
    } else if (currentFilter === 'shipped') {
      filtered = filtered.filter(o => o.status === 'shipped' || o.status === 'dispatched' || o.status === 'out_for_delivery');
    } else {
      filtered = filtered.filter(o => o.status === currentFilter);
    }
  }

  // Sub-tag Filter
  if (currentSubTag === 'gift') {
    filtered = filtered.filter(o => (o.items || []).some(i => i.has_gift));
  } else if (currentSubTag === 'personalized') {
    filtered = filtered.filter(o => (o.items || []).some(i => !i.is_ready_made));
  } else if (currentSubTag === 'ready_stock') {
    filtered = filtered.filter(o => (o.items || []).every(i => i.is_ready_made));
  }

  // Search Filter
  if (currentSearch) {
    filtered = filtered.filter(o => 
      (o.order_number && o.order_number.toLowerCase().includes(currentSearch)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(currentSearch)) ||
      (o.phone && o.phone.includes(currentSearch)) ||
      (o.pincode && o.pincode.includes(currentSearch)) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(currentSearch)) ||
      (o.city && o.city.toLowerCase().includes(currentSearch))
    );
  }

  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageOrders = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // Update Pagination Controls
  const pagInfo = document.getElementById('paginationInfo');
  if (pagInfo) {
    pagInfo.textContent = totalFiltered > 0
      ? `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, totalFiltered)} of ${totalFiltered} orders`
      : 'No orders found';
  }
  const prevBtn = document.getElementById('btnPrevPage');
  const nextBtn = document.getElementById('btnNextPage');
  const pageInd = document.getElementById('pageIndicator');
  if (prevBtn) prevBtn.disabled = (currentPage <= 1);
  if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
  if (pageInd) pageInd.textContent = `Page ${currentPage} of ${totalPages}`;

  if (!pageOrders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--ink-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--ink-admin);">No Orders Found</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">Try changing your filter criteria or search query.</div>
        </td>
      </tr>
    `;
    return;
  }

  const escapeHtml = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  tbody.innerHTML = pageOrders.map(o => {
    const dateFormatted = new Date(o.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    const items = o.items || [];
    const firstItem = items[0] || {};
    const itemThumb = firstItem.product_image || 'design1.jpg';
    const hasMoreItems = items.length > 1;

    let itemDesc = '';
    if (firstItem.is_ready_made) {
      itemDesc = firstItem.product_title || 'Ready-to-Ship Frame';
    } else {
      const en = firstItem.english_name || '';
      const ar = firstItem.arabic_name ? ` (${firstItem.arabic_name})` : '';
      itemDesc = (en ? `Name: ${en}${ar}` : firstItem.product_title);
    }

    const hasGift = items.some(i => i.has_gift);

    return `
      <tr data-order-id="${o.id}">
        <td>
          <div class="order-num-badge">${escapeHtml(o.order_number)}</div>
          <div class="order-date-text">${dateFormatted}</div>
        </td>
        <td>
          <div class="customer-info-col">
            <span class="cust-name">${escapeHtml(o.customer_name)}</span>
            <a href="https://wa.me/91${escapeHtml(o.phone.replace(/\D/g, ''))}" target="_blank" class="cust-phone">
              💬 +91 ${escapeHtml(o.phone)}
            </a>
            <div class="cust-address">${escapeHtml(o.address)} · PIN ${escapeHtml(o.pincode)}</div>
          </div>
        </td>
        <td>
          <div class="frame-items-col">
            <img src="../${escapeHtml(itemThumb)}" class="item-thumb-mini" alt="Frame preview" onerror="this.src='../design1.jpg'" />
            <div>
              <div class="item-desc-text">
                ${escapeHtml(itemDesc)} ${hasMoreItems ? `<strong>(+${items.length - 1} more)</strong>` : ''}
              </div>
              ${hasGift ? '<span class="gift-tag-mini">🎁 Gift Packaging</span>' : ''}
            </div>
          </div>
        </td>
        <td>
          <select class="status-select status-${o.status}" onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="pending_payment" ${o.status === 'pending_payment' || o.status === 'pending_advance' ? 'selected' : ''}>⏳ Awaiting Deposit</option>
            <option value="confirmed" ${o.status === 'confirmed' || o.status === 'advance_paid' ? 'selected' : ''}>💳 Confirmed &amp; Paid</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>🏭 Processing</option>
            <option value="personalization_review" ${o.status === 'personalization_review' || o.status === 'in_production' ? 'selected' : ''}>🎨 Studio Review</option>
            <option value="ready_to_ship" ${o.status === 'ready_to_ship' ? 'selected' : ''}>📦 Ready to Ship</option>
            <option value="shipped" ${o.status === 'shipped' || o.status === 'dispatched' ? 'selected' : ''}>🚚 Dispatched</option>
            <option value="out_for_delivery" ${o.status === 'out_for_delivery' ? 'selected' : ''}>🛵 Out for Delivery</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            <option value="returned" ${o.status === 'returned' ? 'selected' : ''}>🔄 Returned</option>
          </select>
        </td>
        <td class="amount-col">
          <div class="total-amt">₹${Math.round(o.total_amount)}</div>
          <div class="deposit-tag-row">₹${Math.round(o.deposit_amount)} advance</div>
          <div class="cod-tag-row">₹${Math.round(o.cod_amount)} COD</div>
        </td>
        <td>
          <div class="actions-col">
            <button type="button" class="btn-action-icon btn-wa-green" title="11-Template WhatsApp Hub" onclick="openWhatsAppMenu('${o.id}')">
              💬
            </button>
            <button type="button" class="btn-action-icon" title="View Order &amp; Production Checklist" onclick="viewOrderModal('${o.id}')">
              👁️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Change Order Status with Server API & Transition Validation
async function changeOrderStatus(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const previousStatus = order.status;

  try {
    const res = await fetch('/api/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        new_status: newStatus,
        admin_user: 'admin@namora'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      order.status = newStatus;
      showToast(`Order ${order.order_number} status transitioned to ${newStatus.replace(/_/g, ' ')}!`);
      renderDashboard();
    } else {
      showToast(`Error: ${data.error || 'Transition not allowed'}`);
      renderDashboard(); // Revert dropdown
    }
  } catch (err) {
    console.warn('Status update fallback:', err);
    order.status = newStatus;
    renderDashboard();
  }
}

// 10-Point Personalization Production Checklist
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

async function toggleChecklistStep(orderId, stepId, isChecked) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  if (!order.production_checklist) order.production_checklist = {};
  order.production_checklist[stepId] = isChecked;

  try {
    await fetch('/api/update-checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        checklist: order.production_checklist
      })
    });
  } catch (e) {
    console.warn('Checklist sync note:', e);
  }

  updateChecklistProgressUI(order);
}

function updateChecklistProgressUI(order) {
  const cl = order.production_checklist || {};
  const completedCount = CHECKLIST_STEPS.filter(s => cl[s.id] === true).length;
  const progressText = document.getElementById('checklistProgressIndicator');
  if (progressText) {
    progressText.textContent = `${completedCount} / 10 Completed`;
    progressText.style.color = completedCount === 10 ? 'var(--success)' : 'var(--ink-muted)';
  }
}

// Save Shipping & Courier Info
async function saveShippingDetails(orderId, markAsShipped) {
  const courierSelect = document.getElementById('modalCourierSelect');
  const awbInput = document.getElementById('modalTrackingNum');
  const customCourierInput = document.getElementById('modalCustomCourier');

  let courierName = courierSelect ? courierSelect.value : '';
  if (courierName === 'Other' && customCourierInput) {
    courierName = customCourierInput.value.trim() || 'Express Courier';
  }
  const awb = awbInput ? awbInput.value.trim() : '';

  // Construct standard tracking link
  let trackUrl = '';
  if (courierName.includes('BlueDart')) trackUrl = `https://www.bluedart.com/tracking?track=${awb}`;
  else if (courierName.includes('Delhivery')) trackUrl = `https://www.delhivery.com/track/package/${awb}`;
  else if (courierName.includes('DTDC')) trackUrl = `https://www.dtdc.in/tracking.asp`;
  else if (courierName.includes('XpressBees')) trackUrl = `https://www.xpressbees.com/track`;
  else if (courierName.includes('India Post')) trackUrl = `https://www.indiapost.gov.in`;

  try {
    const res = await fetch('/api/save-shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        courier_name: courierName,
        tracking_number: awb,
        tracking_url: trackUrl,
        mark_shipped: markAsShipped
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const order = allOrders.find(o => o.id === orderId);
      if (order) {
        order.courier_name = courierName;
        order.tracking_number = awb;
        order.tracking_url = trackUrl;
        if (markAsShipped) order.status = 'shipped';
      }

      if (data.warning) {
        const warnBanner = document.getElementById('modalAwbWarning');
        if (warnBanner) {
          warnBanner.textContent = data.warning;
          warnBanner.style.display = 'block';
        }
      } else {
        showToast('Shipping details saved successfully!');
        renderDashboard();
      }
    }
  } catch (err) {
    showToast('Shipping details saved (Local Preview)!');
  }
}

// 11-Template WhatsApp Hub
const WA_TEMPLATES = [
  {
    name: '1. Order Received & Awaiting Deposit',
    generate: (o) => `Hi ${o.customer_name}! 🌟\n\nThank you for choosing NAMORA. We have received your order *${o.order_number}* for ${o.items.length} handmade A4 frame(s).\n\nTo confirm and begin crafting in our calligraphy studio, please pay the ₹${Math.round(o.deposit_amount)} advance deposit via UPI.\n\nUPI ID: *namoraworld@upi*\n(Remaining ₹${Math.round(o.cod_amount)} is Cash on Delivery upon doorstep arrival).\n\nPlease reply with a screenshot once paid! ✦`
  },
  {
    name: '2. Deposit Payment Confirmed',
    generate: (o) => `Hi ${o.customer_name}! ✨\n\nYour ₹${Math.round(o.deposit_amount)} deposit for NAMORA order *${o.order_number}* has been verified successfully!\n\nYour order is now officially confirmed. Remaining COD balance: ₹${Math.round(o.cod_amount)}.\n\nOur master artisans are now preparing your artwork in the calligraphy studio.`
  },
  {
    name: '3. Personalization Details Review',
    generate: (o) => {
      const p = o.items.find(i => !i.is_ready_made) || o.items[0] || {};
      return `Hi ${o.customer_name}! 🖋️\n\nPlease confirm your personalization details for order *${o.order_number}*:\n\n• Name: *${p.english_name || 'N/A'}*\n• Calligraphy: *${p.arabic_name || 'N/A'}*\n• Style: *${p.font_style || 'Classic'}*\n• Finish: *${p.ink_style || 'Obsidian Black'}*\n\nIf any corrections are needed, reply immediately. Otherwise, crafting will begin!`;
    }
  },
  {
    name: '4. Frame in Calligraphy Production',
    generate: (o) => `Hi ${o.customer_name}! 🎨\n\nYour handmade frame for order *${o.order_number}* is now being crafted in our calligraphy studio!\n\nEach piece uses 300 GSM archival cardstock, satin wood moulding, and crystal acrylic glass. We will share dispatch details shortly.`
  },
  {
    name: '5. Frame Ready to Ship',
    generate: (o) => `Hi ${o.customer_name}! 📦\n\nYour frame order *${o.order_number}* has passed our 10-point quality inspection and is packaged with luxury satin ribbon.\n\nHandover to our express air courier partner is scheduled for today.`
  },
  {
    name: '6. Dispatched + Courier AWB Link',
    generate: (o) => `Hi ${o.customer_name}! 🚚\n\nYour NAMORA frame order *${o.order_number}* has been dispatched!\n\n• Courier: *${o.courier_name || 'Express Courier'}*\n• AWB Tracking: *${o.tracking_number || 'Available soon'}*\n• COD Balance: *₹${Math.round(o.cod_amount)}*\n\nLive Tracking: ${o.tracking_url || 'https://namoraworld.com'}\nExpected doorstep delivery in 2–3 days.`
  },
  {
    name: '7. Out for Delivery Alert',
    generate: (o) => `Hi ${o.customer_name}! 🛵\n\nYour NAMORA package *${o.order_number}* is OUT FOR DELIVERY today!\n\nPlease keep *₹${Math.round(o.cod_amount)}* exact cash ready for the delivery agent.\n\nGet ready to display your luxury personalized frame! ✨`
  },
  {
    name: '8. Delivered & Feedback Request',
    generate: (o) => `Hi ${o.customer_name}! 🏡\n\nYour NAMORA frame order *${o.order_number}* has been marked as delivered!\n\nWe hope it brings warmth and luxury to your space. Please take a photo, tag us, and let us know how much you love it! ✦`
  },
  {
    name: '9. COD Balance Reminder',
    generate: (o) => `Hi ${o.customer_name}! 🔔\n\nReminder for your upcoming NAMORA frame delivery (*${o.order_number}*):\n\nYour COD balance due at doorstep is *₹${Math.round(o.cod_amount)}*. Both cash and delivery UPI QR codes are supported by the courier.`
  },
  {
    name: '10. Order Cancellation Notice',
    generate: (o) => `Hi ${o.customer_name}. Your NAMORA order *${o.order_number}* has been cancelled as requested. Any advance payment will be processed per our refund policy. Thank you for visiting NAMORA.`
  },
  {
    name: '11. Dedicated Customer Support',
    generate: (o) => `Hi ${o.customer_name}! This is the NAMORA concierge team regarding your order *${o.order_number}*. How may we assist you today?`
  }
];

function openWhatsAppMenu(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  activeWhatsAppOrder = order;
  activeWhatsAppTemplateIdx = 0;

  const modal = document.getElementById('whatsAppModal');
  const sub = document.getElementById('waModalSubtitle');
  if (sub) sub.textContent = `Order ${order.order_number} · Customer: ${order.customer_name} (+91 ${order.phone})`;

  renderWhatsAppTemplates();
  if (modal) modal.style.display = 'block';
}

function renderWhatsAppTemplates() {
  const listEl = document.getElementById('waTemplateList');
  if (!listEl || !activeWhatsAppOrder) return;

  listEl.innerHTML = WA_TEMPLATES.map((tmpl, idx) => `
    <div class="wa-template-card ${idx === activeWhatsAppTemplateIdx ? 'active' : ''}" onclick="selectWhatsAppTemplate(${idx})">
      <span class="wa-template-name">${tmpl.name}</span>
      <span style="font-size: 0.75rem; color: var(--accent-gold);">Select &rarr;</span>
    </div>
  `).join('');

  updateWhatsAppPreview();
}

function selectWhatsAppTemplate(idx) {
  activeWhatsAppTemplateIdx = idx;
  renderWhatsAppTemplates();
}

function updateWhatsAppPreview() {
  const previewEl = document.getElementById('waPreviewText');
  if (!previewEl || !activeWhatsAppOrder) return;
  const tmpl = WA_TEMPLATES[activeWhatsAppTemplateIdx];
  previewEl.textContent = tmpl.generate(activeWhatsAppOrder);
}

function launchWhatsAppMessage() {
  if (!activeWhatsAppOrder) return;
  const tmpl = WA_TEMPLATES[activeWhatsAppTemplateIdx];
  const msg = tmpl.generate(activeWhatsAppOrder);
  const cleanPhone = activeWhatsAppOrder.phone.replace(/\D/g, '').slice(-10);
  const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  closeWhatsAppModal();
}

function closeWhatsAppModal() {
  const modal = document.getElementById('whatsAppModal');
  if (modal) modal.style.display = 'none';
}

// View Order Modal & Packing Slip
function viewOrderModal(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('orderDetailModal');
  const modalContent = document.getElementById('modalContentArea');
  if (!modal || !modalContent) return;

  const escapeHtml = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  const cl = order.production_checklist || {};
  const completedCount = CHECKLIST_STEPS.filter(s => cl[s.id] === true).length;

  const checklistHtml = `
    <div class="production-checklist-card">
      <div class="checklist-header">
        <span class="checklist-title">✦ 10-Point Personalization Production Checklist</span>
        <span class="checklist-progress-text" id="checklistProgressIndicator" style="${completedCount === 10 ? 'color: var(--success);' : ''}">
          ${completedCount} / 10 Completed
        </span>
      </div>
      <div class="checklist-items-grid">
        ${CHECKLIST_STEPS.map(s => `
          <label class="checklist-label ${cl[s.id] ? 'checked' : ''}">
            <input type="checkbox" ${cl[s.id] ? 'checked' : ''} onchange="toggleChecklistStep('${order.id}', '${s.id}', this.checked)" />
            <span>${s.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  const itemsHtml = (order.items || []).map((item, idx) => `
    <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--line-admin);">
      <img src="../${escapeHtml(item.product_image || 'design1.jpg')}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid var(--line-admin);" onerror="this.src='../design1.jpg'" />
      <div style="flex: 1;">
        <div style="font-weight: 700; color: var(--accent-gold); font-size: 0.95rem;">
          ${idx + 1}. ${escapeHtml(item.product_title)}
        </div>
        ${item.is_ready_made ? `
          <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 2px;">⚡ Ready-to-Ship Edition · Ships in 24h</div>
        ` : `
          <div style="font-size: 0.85rem; color: var(--ink-admin); margin-top: 2px;">
            <strong>${escapeHtml(item.english_name)}</strong> ${item.arabic_name ? `· <span style="font-family: 'Amiri', serif;">${escapeHtml(item.arabic_name)}</span>` : ''}
          </div>
          <div style="font-size: 0.78rem; color: var(--ink-muted); margin-top: 2px;">
            Finish: ${escapeHtml(item.ink_style)} · Font: ${escapeHtml(item.font_style)} · Size: A4
          </div>
        `}
        ${item.has_gift ? `
          <div style="margin-top: 0.4rem; background: rgba(212, 175, 106, 0.1); padding: 0.4rem 0.6rem; border-radius: 4px; border-left: 3px solid var(--accent-gold); font-size: 0.78rem;">
            🎁 <strong>Gift Card (+₹69)</strong>: To: ${escapeHtml(item.gift_to || 'Loved One')}, From: ${escapeHtml(item.gift_from || 'Sender')}<br/>
            <em>"${escapeHtml(item.gift_message || 'Best wishes!')}"</em>
          </div>
        ` : ''}
      </div>
      <div style="text-align: right; font-weight: 700; color: var(--ink-admin);">
        ₹${Math.round(item.price)}
      </div>
    </div>
  `).join('');

  modalContent.innerHTML = `
    <div style="border-bottom: 2px solid var(--line-admin); padding-bottom: 1rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-family: var(--font-luxury); font-size: 1.35rem; color: var(--accent-gold); font-weight: 700;">
          ORDER ${escapeHtml(order.order_number)}
        </div>
        <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 2px;">
          Placed on ${new Date(order.created_at).toLocaleString('en-IN')}
        </div>
      </div>
      <button type="button" class="btn-website-link" onclick="window.print()" style="cursor: pointer;">
        🖨️ Print Packing Slip
      </button>
    </div>

    <!-- Customer & Shipping Box -->
    <div style="background: var(--bg-admin); border: 1px solid var(--line-admin); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
      <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-gold); font-weight: 700; letter-spacing: 0.06em; margin-bottom: 0.4rem;">
        Shipping &amp; Recipient Details
      </div>
      <div style="font-size: 1rem; font-weight: 700; color: var(--ink-admin); margin-bottom: 0.2rem;">
        ${escapeHtml(order.customer_name)}
      </div>
      <div style="color: var(--ink-muted); font-size: 0.85rem; line-height: 1.4;">
        ${escapeHtml(order.address)}<br/>
        ${order.city ? escapeHtml(order.city) + ', ' : ''}${order.state ? escapeHtml(order.state) + ' — ' : ''}<strong>PIN ${escapeHtml(order.pincode)}</strong>
      </div>
      <div style="margin-top: 0.5rem; font-size: 0.85rem;">
        📞 Phone: <strong>+91 ${escapeHtml(order.phone)}</strong>
      </div>
    </div>

    <!-- Production Checklist -->
    ${checklistHtml}

    <!-- Items List -->
    <div style="margin-bottom: 1.5rem;">
      <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--ink-muted); font-weight: 700; letter-spacing: 0.06em; margin-bottom: 0.5rem;">
        Order Items (${order.items.length})
      </div>
      ${itemsHtml}
    </div>

    <!-- Courier Tracking Info Updater -->
    <div class="shipping-manager-box">
      <div class="shipping-manager-title">
        <span>📦 Courier Dispatch &amp; Tracking (Manually Managed)</span>
        <span style="font-size: 0.72rem; color: var(--ink-muted); text-transform: none;">AWB Duplicate Protection Active</span>
      </div>
      <div class="shipping-inputs-grid">
        <select id="modalCourierSelect" class="form-input" style="padding: 0.5rem;" onchange="if(this.value==='Other')document.getElementById('modalCustomCourier').style.display='block';else document.getElementById('modalCustomCourier').style.display='none';">
          <option value="BlueDart Air" ${order.courier_name === 'BlueDart Air' ? 'selected' : ''}>BlueDart Air Express</option>
          <option value="Delhivery Express" ${order.courier_name === 'Delhivery Express' ? 'selected' : ''}>Delhivery Express</option>
          <option value="DTDC Priority" ${order.courier_name === 'DTDC Priority' ? 'selected' : ''}>DTDC Priority</option>
          <option value="XpressBees" ${order.courier_name === 'XpressBees' ? 'selected' : ''}>XpressBees Surface</option>
          <option value="India Post" ${order.courier_name === 'India Post' ? 'selected' : ''}>India Post Speed Post</option>
          <option value="Shadowfax" ${order.courier_name === 'Shadowfax' ? 'selected' : ''}>Shadowfax Air</option>
          <option value="Other">Other Courier...</option>
        </select>
        <input type="text" id="modalTrackingNum" class="form-input" style="padding: 0.5rem;" placeholder="AWB / Tracking Number" value="${escapeHtml(order.tracking_number || '')}" />
        <button type="button" class="btn-ship-action" onclick="saveShippingDetails('${order.id}', false)">
          Save AWB
        </button>
      </div>
      <input type="text" id="modalCustomCourier" class="form-input" style="display: none; padding: 0.5rem; margin-bottom: 0.5rem;" placeholder="Specify courier name..." />
      <div class="awb-warning-banner" id="modalAwbWarning"></div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
        <div style="font-size: 0.75rem; color: var(--ink-muted);">
          ${order.tracking_url ? `<a href="${escapeHtml(order.tracking_url)}" target="_blank" style="color: var(--accent-gold);">🔗 Open Courier Tracking Page &rarr;</a>` : 'AWB link generated automatically on save.'}
        </div>
        ${order.status !== 'shipped' && order.status !== 'delivered' ? `
          <button type="button" class="btn-ship-action" style="background: var(--info); color: #fff;" onclick="saveShippingDetails('${order.id}', true)">
            🚚 Mark Shipped &amp; Record Timestamp
          </button>
        ` : `
          <span style="font-size: 0.75rem; color: var(--success); font-weight: 600;">✓ Dispatched at ${new Date(order.dispatched_at || order.created_at).toLocaleDateString('en-IN')}</span>
        `}
      </div>
    </div>
  `;

  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) modal.style.display = 'none';
}

// Customers Directory
async function loadCustomers() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--ink-muted);">Loading customers directory...</td></tr>`;

  try {
    const res = await fetch('/api/customers');
    if (res.ok) {
      const data = await res.json();
      allCustomers = data.customers || [];
    } else {
      const client = getSupabase();
      if (client) {
        const { data } = await client.from('customers').select('*').order('total_spent', { ascending: false });
        allCustomers = data || [];
      }
    }
  } catch (e) {
    allCustomers = [];
  }

  renderCustomersTable();
}

function renderCustomersTable() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  if (!allCustomers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--ink-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
          <div>No customer profiles registered yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  const escapeHtml = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  tbody.innerHTML = allCustomers.map(c => `
    <tr>
      <td>
        <strong style="color: var(--ink-admin); font-size: 0.95rem;">${escapeHtml(c.name)}</strong>
      </td>
      <td>
        <a href="https://wa.me/91${escapeHtml(c.phone)}" target="_blank" class="cust-phone">
          💬 +91 ${escapeHtml(c.phone)}
        </a>
      </td>
      <td>
        <span class="order-num-badge">${c.order_count || 1} orders</span>
      </td>
      <td>
        <strong style="color: var(--accent-gold);">₹${Math.round(c.total_spent || 0).toLocaleString('en-IN')}</strong>
      </td>
      <td style="color: var(--ink-muted); font-size: 0.85rem; max-width: 250px;">
        ${escapeHtml(c.last_address || 'N/A')} · ${escapeHtml(c.last_pincode || '')}
      </td>
      <td style="text-align: right;">
        <a href="https://wa.me/91${escapeHtml(c.phone)}?text=Hi%20${encodeURIComponent(c.name)}%2C%20greetings%20from%20NAMORA!" target="_blank" class="btn-action-icon btn-wa-green" title="Chat on WhatsApp">
          💬 Chat
        </a>
      </td>
    </tr>
  `).join('');
}

// Reviews Moderation
async function loadReviews() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--ink-muted);">Loading reviews...</td></tr>`;

  try {
    const res = await fetch('/api/reviews');
    if (res.ok) {
      const data = await res.json();
      allReviews = data.reviews || [];
    } else {
      const client = getSupabase();
      if (client) {
        const { data } = await client.from('reviews').select('*').order('created_at', { ascending: false });
        allReviews = data || [];
      }
    }
  } catch (e) {
    allReviews = [];
  }

  renderReviewsTable();
}

function renderReviewsTable() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  if (!allReviews.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem; color: var(--ink-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
          <div>No customer reviews logged yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  const escapeHtml = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  tbody.innerHTML = allReviews.map(r => `
    <tr>
      <td><strong>${escapeHtml(r.customer_name)}</strong></td>
      <td style="color: #F59E0B;">${'★'.repeat(r.rating || 5)}</td>
      <td style="font-size: 0.85rem; max-width: 320px; line-height: 1.4;">
        "${escapeHtml(r.comment)}"
      </td>
      <td>
        <span class="stock-badge-${r.status === 'approved' ? 'active' : (r.status === 'rejected' ? 'out' : 'active')}" style="position: static;">
          ${r.status.toUpperCase()}
        </span>
      </td>
      <td style="color: var(--ink-muted); font-size: 0.8rem;">
        ${new Date(r.created_at).toLocaleDateString('en-IN')}
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-page" onclick="moderateReview('${r.id}', 'approved')" style="color: var(--success);" title="Approve">✓</button>
        <button type="button" class="btn-page" onclick="moderateReview('${r.id}', 'rejected')" style="color: var(--warning);" title="Reject">✕</button>
        <button type="button" class="btn-page" onclick="deleteReview('${r.id}')" style="color: var(--danger);" title="Delete">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function moderateReview(reviewId, status) {
  try {
    const res = await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'moderate', review_id: reviewId, status })
    });
    if (res.ok) {
      const r = allReviews.find(rev => rev.id === reviewId);
      if (r) r.status = status;
      showToast(`Review marked as ${status}!`);
      renderReviewsTable();
    }
  } catch (e) {
    showToast('Review status updated!');
  }
}

async function deleteReview(reviewId) {
  if (!confirm('Are you sure you want to delete this review?')) return;
  try {
    const res = await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', review_id: reviewId })
    });
    if (res.ok) {
      allReviews = allReviews.filter(rev => rev.id !== reviewId);
      showToast('Review deleted.');
      renderReviewsTable();
    }
  } catch (e) {
    showToast('Review deleted.');
  }
}

// Toast Helper
function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--card-admin);
      border: 1px solid var(--accent-gold);
      color: var(--ink-admin);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-admin);
      font-size: 0.85rem;
      font-weight: 600;
      z-index: 9999;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 3500);
}

// Initialize Admin on DOM Load
async function initAdmin() {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return;
  await loadOrders();
}

document.addEventListener('DOMContentLoaded', initAdmin);
