/**
 * NAMORA ADMIN DASHBOARD LOGIC
 * Protected Order Management, Real-time Status Sync, and WhatsApp Dispatch Hub
 */

// Demo orders for immediate preview if Supabase is unconfigured
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
    status: 'in_production',
    payment_method: 'deposit_cod',
    payment_status: 'deposit_received',
    courier_name: 'BlueDart Air',
    tracking_number: 'BLUEDART-842918',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
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
    status: 'dispatched',
    payment_method: 'deposit_cod',
    payment_status: 'deposit_received',
    courier_name: 'Delhivery Express',
    tracking_number: 'DELH-9928172',
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
  },
  {
    id: 'demo-3',
    order_number: 'NAM-8423',
    customer_name: 'Fatima Siddiqui',
    phone: '9820192837',
    address: 'House 88, Sector 14, Near Metro Station',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    total_amount: 499.00,
    deposit_amount: 49.00,
    cod_amount: 450.00,
    status: 'pending_advance',
    payment_method: 'deposit_cod',
    payment_status: 'unpaid',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    items: [
      {
        product_title: 'Fatima (فاطمة) — Carpet Mosaic',
        product_image: 'name4.jpg',
        is_ready_made: true,
        category_label: 'Ready Names',
        price: 499.00,
        deposit: 49.00,
        cod: 450.00
      }
    ]
  }
];

let allOrders = [];
let currentFilter = 'all';
let currentSearch = '';

// Check Supabase Client
function getSupabase() {
  const config = window.NAMORA_SUPABASE_CONFIG || {};
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

  // In production (DEMO_ADMIN_MODE !== true), strictly reject demo bypass
  if (!isDemoAllowed) {
    if (localStorage.getItem('namora_admin_demo')) {
      localStorage.removeItem('namora_admin_demo');
    }
  } else if (localStorage.getItem('namora_admin_demo') === 'true') {
    // Only allowed if explicitly configured in development mode
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
    await client.auth.signOut();
  }
  window.location.href = 'login.html';
}

// Load Orders from Supabase or Fallback
async function loadOrders() {
  const client = getSupabase();

  if (!client) {
    allOrders = [...DEMO_ORDERS];
    renderDashboard();
    return;
  }

  try {
    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Orders fetch error from Supabase, showing demo:', error);
      allOrders = [...DEMO_ORDERS];
    } else {
      allOrders = data.map(o => ({
        ...o,
        items: o.order_items || []
      }));
    }
  } catch (err) {
    console.warn('Unexpected error loading orders:', err);
    allOrders = [...DEMO_ORDERS];
  }

  renderDashboard();
}

// Render Dashboard (Metrics, Filters, Table)
function renderDashboard() {
  renderMetrics();
  renderOrdersTable();
}

function renderMetrics() {
  const totalOrders = allOrders.length;
  const pendingAdvance = allOrders.filter(o => o.status === 'pending_advance').length;
  const inStudio = allOrders.filter(o => o.status === 'in_production' || o.status === 'advance_paid').length;
  const dispatched = allOrders.filter(o => o.status === 'dispatched').length;
  const delivered = allOrders.filter(o => o.status === 'delivered').length;
  const totalRevenue = allOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('metricTotalOrders', totalOrders);
  setEl('metricPendingAdvance', pendingAdvance);
  setEl('metricInStudio', inStudio);
  setEl('metricDispatched', dispatched);
  setEl('metricDelivered', delivered);
  setEl('metricTotalRevenue', '₹' + Math.round(totalRevenue).toLocaleString('en-IN'));

  // Update counts in filter pills
  setEl('countAll', totalOrders);
  setEl('countPending', pendingAdvance);
  setEl('countInStudio', inStudio);
  setEl('countDispatched', dispatched);
  setEl('countDelivered', delivered);
}

function filterByStatus(status, btn) {
  currentFilter = status;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  renderOrdersTable();
}

function handleSearch(term) {
  currentSearch = (term || '').toLowerCase().trim();
  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  let filtered = allOrders;

  // Status Filter
  if (currentFilter !== 'all') {
    if (currentFilter === 'in_studio') {
      filtered = filtered.filter(o => o.status === 'in_production' || o.status === 'advance_paid');
    } else {
      filtered = filtered.filter(o => o.status === currentFilter);
    }
  }

  // Search Filter
  if (currentSearch) {
    filtered = filtered.filter(o => 
      (o.order_number && o.order_number.toLowerCase().includes(currentSearch)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(currentSearch)) ||
      (o.phone && o.phone.includes(currentSearch)) ||
      (o.pincode && o.pincode.includes(currentSearch)) ||
      (o.city && o.city.toLowerCase().includes(currentSearch))
    );
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--ink-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--ink-admin);">No Orders Found</div>
          <div style="font-size: 0.8rem; margin-top: 0.25rem;">Try changing your filter or search query.</div>
        </td>
      </tr>
    `;
    return;
  }

  const escapeHtml = str => (str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));

  tbody.innerHTML = filtered.map(o => {
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
            <a href="https://wa.me/91${escapeHtml(o.phone)}" target="_blank" class="cust-phone">
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
            <option value="pending_advance" ${o.status === 'pending_advance' ? 'selected' : ''}>⏳ Awaiting ₹49 Deposit</option>
            <option value="advance_paid" ${o.status === 'advance_paid' ? 'selected' : ''}>💳 Advance Paid</option>
            <option value="in_production" ${o.status === 'in_production' ? 'selected' : ''}>🎨 In Calligraphy Studio</option>
            <option value="dispatched" ${o.status === 'dispatched' ? 'selected' : ''}>🚚 Dispatched</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
          </select>
        </td>
        <td class="amount-col">
          <div class="total-amt">₹${Math.round(o.total_amount)}</div>
          <div class="deposit-tag-row">₹${Math.round(o.deposit_amount)} advance</div>
          <div class="cod-tag-row">₹${Math.round(o.cod_amount)} COD</div>
        </td>
        <td>
          <div class="actions-col">
            <button type="button" class="btn-action-icon btn-wa-green" title="Quick WhatsApp Message" onclick="openWhatsAppMenu('${o.id}')">
              💬
            </button>
            <button type="button" class="btn-action-icon" title="View Order Details & Packing Slip" onclick="viewOrderModal('${o.id}')">
              👁️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Change Order Status with Instant Supabase Sync & Audit Logging
async function changeOrderStatus(orderId, newStatus) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const previousStatus = order.status;
  order.status = newStatus;
  renderDashboard();

  const client = getSupabase();
  if (client && !orderId.startsWith('demo-')) {
    try {
      const { error } = await client
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        showToast('Supabase update note: ' + error.message);
      } else {
        showToast(`Order ${order.order_number} status updated to ${newStatus.replace('_', ' ')}!`);

        // If order was cancelled, reverse stock for ready-made physical items
        if (newStatus === 'cancelled' && previousStatus !== 'cancelled' && order.items) {
          for (const item of order.items) {
            if (item.is_ready_made && item.product_id) {
              try {
                await client.rpc('adjust_product_inventory', {
                  p_product_id: item.product_id,
                  p_change_qty: 1,
                  p_movement_type: 'cancellation',
                  p_notes: `Restored from cancelled order ${order.order_number}`
                });
              } catch (invErr) {
                console.warn('Inventory reversal note:', invErr);
              }
            }
          }
        }

        // Audit log action
        auditLogAdminAction('order_status_changed', 'orders', orderId, {
          order_number: order.order_number,
          from: previousStatus,
          to: newStatus
        });
      }
    } catch (e) {
      console.warn('Status update error:', e);
    }
  } else {
    showToast(`Order ${order.order_number} status updated (Local Preview)!`);
  }
}

// Audit Log Helper
async function auditLogAdminAction(action, entityType, entityId, metadata) {
  const client = getSupabase();
  if (!client) return;

  try {
    const { data: { session } } = await client.auth.getSession();
    const adminUser = (session && session.user && session.user.email) || 'admin';
    await client
      .from('admin_activity_logs')
      .insert([{
        admin_user_id: adminUser,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {}
      }]);
  } catch (err) {
    // Non-blocking log warning
    console.warn('Audit log write note:', err.message);
  }
}

// 1-Click WhatsApp Quick Actions
function openWhatsAppMenu(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const phone = order.phone.replace(/\D/g, '');
  const cleanPhone = phone.length >= 10 ? phone.slice(-10) : phone;

  let msg = '';
  if (order.status === 'pending_advance') {
    msg = `Hi ${order.customer_name}! 🌟\n\nThank you for choosing NAMORA. We have received your order *${order.order_number}* for ${order.items.length} handmade A4 frame(s).\n\nTo confirm and begin crafting in our calligraphy studio, please pay the ₹${Math.round(order.deposit_amount)} reservation deposit via UPI.\n\nUPI ID: *namoraworld@upi*\n(Remaining ₹${Math.round(order.cod_amount)} is payable via Cash on Delivery upon doorstep arrival).\n\nPlease reply with payment screenshot once completed!`;
  } else if (order.status === 'in_production') {
    msg = `Hi ${order.customer_name}! 🎨\n\nYour handmade A4 frame for order *${order.order_number}* is now being crafted in our calligraphy studio! Each piece is carefully framed with satin wood moulding and crystal glass.\n\nWe will share dispatch and courier tracking updates shortly.`;
  } else if (order.status === 'dispatched') {
    const courier = order.courier_name || 'Express Air';
    const awb = order.tracking_number || 'En route';
    msg = `Hi ${order.customer_name}! 🚚\n\nExciting news — your NAMORA frame order *${order.order_number}* has been dispatched via *${courier}* (AWB: *${awb}*)!\n\nDelivery is expected in 2-3 business days. Please keep ₹${Math.round(order.cod_amount)} cash ready for the delivery agent.\n\nTrack live anytime: https://namoraworld.com/#track`;
  } else {
    msg = `Hi ${order.customer_name}! This is NAMORA regarding your frame order *${order.order_number}*. How can we assist you today?`;
  }

  const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
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

    <!-- Items List -->
    <div style="margin-bottom: 1.5rem;">
      <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--ink-muted); font-weight: 700; letter-spacing: 0.06em; margin-bottom: 0.5rem;">
        Order Items (${order.items.length})
      </div>
      ${itemsHtml}
    </div>

    <!-- Courier Tracking Info Updater -->
    <div style="background: rgba(212, 175, 106, 0.06); border: 1px dashed var(--line-admin); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.5rem; text-transform: uppercase;">
        📦 Courier Dispatch Details
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.5rem;">
        <input type="text" id="modalCourierName" class="search-input" style="padding: 0.5rem;" placeholder="Courier (e.g. BlueDart Air)" value="${escapeHtml(order.courier_name || '')}" />
        <input type="text" id="modalTrackingNum" class="search-input" style="padding: 0.5rem;" placeholder="Tracking / AWB Number" value="${escapeHtml(order.tracking_number || '')}" />
      </div>
      <button type="button" class="filter-btn active" style="width: 100%; justify-content: center;" onclick="saveModalCourier('${order.id}')">
        Save Courier Info &amp; Update Customer Tracker
      </button>
    </div>

    <!-- Totals Summary -->
    <div style="border-top: 2px solid var(--line-admin); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem;">
      <div style="display: flex; justify-content: space-between; color: var(--ink-muted);">
        <span>Total Order Value:</span>
        <span style="font-weight: 700; color: var(--ink-admin);">₹${Math.round(order.total_amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: var(--success);">
        <span>Online Reservation Deposit Paid:</span>
        <span style="font-weight: 700;">₹${Math.round(order.deposit_amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed var(--line-admin);">
        <span>CASH TO COLLECT ON DELIVERY (COD):</span>
        <span>₹${Math.round(order.cod_amount)}</span>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) modal.classList.remove('open');
}

async function saveModalCourier(orderId) {
  const courier = document.getElementById('modalCourierName').value.trim();
  const awb = document.getElementById('modalTrackingNum').value.trim();

  const order = allOrders.find(o => o.id === orderId);
  if (order) {
    order.courier_name = courier;
    order.tracking_number = awb;
  }

  const client = getSupabase();
  if (client && !orderId.startsWith('demo-')) {
    await client
      .from('orders')
      .update({ courier_name: courier, tracking_number: awb })
      .eq('id', orderId);
  }

  showToast('Courier details saved & live tracker updated!');
}

function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--accent-gold);
      color: #141210;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 0.8rem 1.4rem;
      border-radius: var(--radius-pill);
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 2000;
      transition: var(--transition);
      opacity: 0;
      transform: translateY(10px);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3000);
}

// Keyboard shortcuts (Escape closes modal)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await checkAdminAuth();
  if (isAuth) {
    loadOrders();
  }
});
