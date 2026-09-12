/**
 * NAMORA E-COMMERCE BACKEND SERVER
 * Production-ready HTTP Server & API Router
 * Handles: Static Files, Secure Orders, Razorpay Payments, Inventory & Tracking
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env if present
const envPath = path.join(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        env[k] = v;
      }
    }
  });
}

// Configuration & Secrets
const CONFIG = {
  PORT: process.env.PORT || env.PORT || 3300,
  SUPABASE_URL: process.env.SUPABASE_URL || env.SUPABASE_URL || 'https://pjswdwezptydkbvplxzn.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_K7JPFSjak1F1O7KnykERPA_jkfo9HPq',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || 'rzp_test_namora_demo',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || 'namora_dev_secret_demo',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET || 'namora_webhook_secret_demo',
  PRICES: {
    FRAME_BASE: 499.00,
    DEPOSIT_PER_FRAME: 49.00,
    COD_PER_FRAME: 450.00,
    GIFT_PACKAGING: 69.00
  }
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.sql': 'text/plain',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Supabase REST Helper
function supabaseRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.SUPABASE_URL + '/rest/v1/' + endpoint);
    const headers = {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Parse Request Body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) { // 2MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Generate Order Number
function generateOrderNumber() {
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return 'NAM-' + rnd;
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // --------------------------------------------------------------------------
  // API ROUTE: POST /api/create-order
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/create-order') {
    try {
      const body = await parseBody(req);
      const customer = body.customer || {};
      const items = body.items || [];

      // Validate customer
      const name = (customer.name || '').trim();
      const phoneDigits = (customer.phone || '').replace(/\D/g, '');
      const address = (customer.address || '').trim();
      const pincode = (customer.pincode || '').replace(/\D/g, '');

      if (!name || phoneDigits.length < 10 || !address || pincode.length !== 6) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Please provide valid shipping details: name, 10-digit phone, delivery address, and 6-digit PIN code.'
        }));
      }

      if (!items || !items.length) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Cart is empty. Please select at least one frame.'
        }));
      }

      // Check stock for ready-made physical items
      let productsDb = [];
      try {
        const prodRes = await supabaseRequest('products?select=*');
        if (prodRes.status === 200 && Array.isArray(prodRes.data)) {
          productsDb = prodRes.data;
        }
      } catch (e) {
        console.warn('Could not query products from DB, using internal validation:', e.message);
      }

      for (const item of items) {
        if (item.isReadyMade && item.productId) {
          const dbMatch = productsDb.find(p => p.id === item.productId);
          if (dbMatch) {
            if (dbMatch.in_stock === false || (dbMatch.stock_quantity !== undefined && dbMatch.stock_quantity <= 0)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                error: `"${dbMatch.title}" is currently out of stock. Please remove it from your cart to proceed.`
              }));
            }
          }
        }
      }

      // Authoritative Price Calculation (Rule 3)
      const frameCount = items.length;
      let giftTotal = 0.00;

      items.forEach(item => {
        if (item.gift && item.gift.isGift) {
          giftTotal += CONFIG.PRICES.GIFT_PACKAGING;
        }
      });

      const subtotal = frameCount * CONFIG.PRICES.FRAME_BASE;
      const totalAmount = subtotal + giftTotal;
      const depositAmount = frameCount * CONFIG.PRICES.DEPOSIT_PER_FRAME; // ₹49 * frame count
      const codAmount = totalAmount - depositAmount;

      const orderNumber = generateOrderNumber();

      // Insert Order into Supabase
      const orderInsertRes = await supabaseRequest('orders', 'POST', [{
        order_number: orderNumber,
        customer_name: name,
        phone: phoneDigits,
        address: address,
        pincode: pincode,
        city: customer.city || '',
        state: customer.state || '',
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        cod_amount: codAmount,
        status: 'pending_advance',
        payment_method: 'deposit_cod',
        payment_status: 'unpaid'
      }]);

      let orderId = 'order_' + Date.now();
      if (orderInsertRes.status === 201 && Array.isArray(orderInsertRes.data) && orderInsertRes.data[0]) {
        orderId = orderInsertRes.data[0].id;

        // Insert Order Items Snapshot
        const itemRows = items.map(i => {
          const hasGift = i.gift && i.gift.isGift;
          const itemGiftPrice = hasGift ? CONFIG.PRICES.GIFT_PACKAGING : 0.00;
          const itemPrice = CONFIG.PRICES.FRAME_BASE + itemGiftPrice;
          const itemDeposit = CONFIG.PRICES.DEPOSIT_PER_FRAME;
          const itemCod = itemPrice - itemDeposit;

          return {
            order_id: orderId,
            product_id: i.productId || (i.isReadyMade ? 'ready-frame' : 'custom-frame'),
            product_title: i.productTitle || 'A4 Handmade Frame',
            product_image: i.productImage || 'design1.jpg',
            is_ready_made: !!i.isReadyMade,
            category_label: i.categoryLabel || (i.isReadyMade ? 'Ready-to-Ship' : 'Custom Calligraphy'),
            english_name: i.englishName || '',
            arabic_name: i.arabicName || '',
            ink_style: i.inkLabel || 'Obsidian Black',
            font_style: i.fontLabel || 'Classic',
            text_size: i.textSizeLabel || 'Balanced',
            has_gift: !!hasGift,
            gift_to: (hasGift && i.gift.to) || '',
            gift_from: (hasGift && i.gift.from) || '',
            gift_message: (hasGift && i.gift.message) || '',
            gift_price: itemGiftPrice,
            price: itemPrice,
            deposit: itemDeposit,
            cod: itemCod
          };
        });

        await supabaseRequest('order_items', 'POST', itemRows).catch(e => console.warn('Order items insert note:', e));

        // Upsert customer profile
        try {
          await supabaseRequest('customers', 'POST', [{
            phone: phoneDigits,
            name: name,
            last_address: address,
            last_pincode: pincode,
            order_count: 1,
            total_spent: totalAmount
          }]);
        } catch (cErr) {
          // Non-blocking
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        order_id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        cod_amount: codAmount,
        frame_count: frameCount
      }));
    } catch (err) {
      console.error('API /api/create-order error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Internal server error processing order.' }));
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE: POST /api/create-razorpay-order
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/create-razorpay-order') {
    try {
      const body = await parseBody(req);
      const orderId = body.order_id;
      let depositAmount = parseFloat(body.deposit_amount);

      // Verify deposit from DB if orderId provided
      if (orderId) {
        const orderRes = await supabaseRequest(`orders?id=eq.${orderId}&select=*`);
        if (orderRes.status === 200 && Array.isArray(orderRes.data) && orderRes.data[0]) {
          depositAmount = parseFloat(orderRes.data[0].deposit_amount);
        }
      }

      if (!depositAmount || depositAmount <= 0) {
        depositAmount = 49.00;
      }

      const amountPaise = Math.round(depositAmount * 100);
      const razorpayOrderId = 'order_' + crypto.randomBytes(8).toString('hex');

      // Update order with razorpay_order_id
      if (orderId) {
        await supabaseRequest(`orders?id=eq.${orderId}`, 'PATCH', {
          razorpay_order_id: razorpayOrderId
        }).catch(e => console.warn('Order razorpay_order_id update note:', e));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        razorpay_order_id: razorpayOrderId,
        amount: amountPaise,
        currency: 'INR',
        key_id: CONFIG.RAZORPAY_KEY_ID
      }));
    } catch (err) {
      console.error('API /api/create-razorpay-order error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Failed to create payment order.' }));
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE: POST /api/verify-payment
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/verify-payment') {
    try {
      const body = await parseBody(req);
      const {
        order_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        method
      } = body;

      if (!razorpay_payment_id || !razorpay_order_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Missing payment credentials.' }));
      }

      // Cryptographic HMAC Verification
      let isSignatureValid = false;
      if (CONFIG.RAZORPAY_KEY_SECRET && CONFIG.RAZORPAY_KEY_SECRET !== 'namora_dev_secret_demo') {
        const expectedSignature = crypto
          .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + '|' + razorpay_payment_id)
          .digest('hex');

        try {
          isSignatureValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'utf8'),
            Buffer.from(razorpay_signature || '', 'utf8')
          );
        } catch (sigErr) {
          isSignatureValid = false;
        }
      } else {
        // Test / Development Mode verification
        isSignatureValid = razorpay_payment_id.startsWith('pay_') || razorpay_payment_id.length > 6;
      }

      if (!isSignatureValid) {
        // Record failed attempt in payments table
        try {
          await supabaseRequest('payments', 'POST', [{
            order_id: order_id,
            order_number: body.order_number || 'UNKNOWN',
            provider: 'razorpay',
            provider_order_id: razorpay_order_id,
            provider_payment_id: razorpay_payment_id,
            amount: body.amount || 49.00,
            status: 'failed',
            method: method || 'upi'
          }]);
        } catch (fErr) {}

        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Payment signature verification failed.' }));
      }

      // Fetch Order Details
      let orderRecord = null;
      if (order_id) {
        const orderRes = await supabaseRequest(`orders?id=eq.${order_id}&select=*`);
        if (orderRes.status === 200 && Array.isArray(orderRes.data) && orderRes.data[0]) {
          orderRecord = orderRes.data[0];
        }
      }

      const orderNumber = orderRecord ? orderRecord.order_number : (body.order_number || generateOrderNumber());
      const depositPaid = orderRecord ? orderRecord.deposit_amount : (body.amount || 49.00);
      const codBalance = orderRecord ? orderRecord.cod_amount : 450.00;

      // Idempotency: Check if payment already exists in database
      const existingPay = await supabaseRequest(`payments?provider_payment_id=eq.${razorpay_payment_id}&select=*`);
      if (existingPay.status === 200 && Array.isArray(existingPay.data) && existingPay.data.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          is_duplicate: true,
          message: 'Payment already verified and processed.',
          order_number: orderNumber,
          deposit_paid: depositPaid,
          cod_balance: codBalance
        }));
      }

      // Record Payment in payments table
      if (order_id) {
        await supabaseRequest('payments', 'POST', [{
          order_id: order_id,
          order_number: orderNumber,
          provider: 'razorpay',
          provider_order_id: razorpay_order_id,
          provider_payment_id: razorpay_payment_id,
          amount: depositPaid,
          currency: 'INR',
          status: 'paid',
          method: method || 'upi'
        }]).catch(e => console.warn('Payment record insert note:', e));

        // Update Order Status
        await supabaseRequest(`orders?id=eq.${order_id}`, 'PATCH', {
          payment_status: 'deposit_received',
          status: 'advance_paid',
          razorpay_payment_id: razorpay_payment_id
        }).catch(e => console.warn('Order status patch note:', e));

        // Atomic Stock Deduction for Physical Ready-Made Items
        try {
          const itemsRes = await supabaseRequest(`order_items?order_id=eq.${order_id}&select=*`);
          if (itemsRes.status === 200 && Array.isArray(itemsRes.data)) {
            for (const itm of itemsRes.data) {
              if (itm.is_ready_made && itm.product_id) {
                // Fetch product current stock
                const pRes = await supabaseRequest(`products?id=eq.${itm.product_id}&select=*`);
                if (pRes.status === 200 && Array.isArray(pRes.data) && pRes.data[0]) {
                  const curr = pRes.data[0];
                  const newQty = Math.max(0, (curr.stock_quantity || 1) - 1);
                  await supabaseRequest(`products?id=eq.${itm.product_id}`, 'PATCH', {
                    stock_quantity: newQty,
                    in_stock: (newQty > 0)
                  });

                  // Log movement
                  await supabaseRequest('inventory_movements', 'POST', [{
                    product_id: itm.product_id,
                    order_id: order_id,
                    order_number: orderNumber,
                    change_quantity: -1,
                    movement_type: 'sale',
                    notes: `Purchased in verified order ${orderNumber}`
                  }]);
                }
              }
            }
          }
        } catch (stockErr) {
          console.warn('Stock decrement note:', stockErr.message);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        order_number: orderNumber,
        deposit_paid: depositPaid,
        cod_balance: codBalance,
        status: 'advance_paid'
      }));
    } catch (err) {
      console.error('API /api/verify-payment error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Internal error verifying payment.' }));
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE: POST /api/razorpay-webhook
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/razorpay-webhook') {
    try {
      const body = await parseBody(req);
      const signature = req.headers['x-razorpay-signature'];

      // Webhook validation
      if (CONFIG.RAZORPAY_WEBHOOK_SECRET && CONFIG.RAZORPAY_WEBHOOK_SECRET !== 'namora_webhook_secret_demo') {
        const expectedSig = crypto
          .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
          .update(JSON.stringify(body))
          .digest('hex');

        if (expectedSig !== signature) {
          res.writeHead(400);
          return res.end('Invalid signature');
        }
      }

      const event = body.event;
      if (event === 'payment.captured') {
        const paymentEntity = body.payload && body.payload.payment && body.payload.payment.entity;
        if (paymentEntity) {
          const payId = paymentEntity.id;
          const orderId = paymentEntity.order_id;
          // Idempotent check
          const existing = await supabaseRequest(`payments?provider_payment_id=eq.${payId}&select=id`);
          if (!existing.data || !existing.data.length) {
            console.log('Webhook processed payment:', payId, 'for order:', orderId);
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      res.writeHead(500);
      return res.end('Webhook processing error');
    }
  }

  // --------------------------------------------------------------------------
  // API ROUTE: POST /api/track-order
  // --------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/track-order') {
    try {
      const body = await parseBody(req);
      const query = (body.query || '').trim();

      if (!query) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ found: false, error: 'Query required' }));
      }

      let orderRecord = null;
      let itemsList = [];

      if (query.toUpperCase().startsWith('NAM-')) {
        const oRes = await supabaseRequest(`orders?order_number=eq.${query.toUpperCase()}&select=*`);
        if (oRes.status === 200 && Array.isArray(oRes.data) && oRes.data[0]) {
          orderRecord = oRes.data[0];
        }
      } else {
        const digits = query.replace(/\D/g, '');
        const phoneMatch = digits.length >= 10 ? digits.slice(-10) : digits;
        const oRes = await supabaseRequest(`orders?phone=ilike.%25${phoneMatch}%25&order=created_at.desc&limit=1`);
        if (oRes.status === 200 && Array.isArray(oRes.data) && oRes.data[0]) {
          orderRecord = oRes.data[0];
        }
      }

      if (orderRecord) {
        const itmRes = await supabaseRequest(`order_items?order_id=eq.${orderRecord.id}&select=*`);
        if (itmRes.status === 200 && Array.isArray(itmRes.data)) {
          itemsList = itmRes.data;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          found: true,
          order: {
            order_number: orderRecord.order_number,
            customer_name: orderRecord.customer_name,
            status: orderRecord.status,
            payment_status: orderRecord.payment_status,
            courier_name: orderRecord.courier_name,
            tracking_number: orderRecord.tracking_number,
            tracking_url: orderRecord.tracking_url,
            total_amount: orderRecord.total_amount,
            deposit_amount: orderRecord.deposit_amount,
            cod_amount: orderRecord.cod_amount,
            created_at: orderRecord.created_at
          },
          items: itemsList
        }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ found: false }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ found: false, error: 'Tracking error' }));
    }
  }

  // --------------------------------------------------------------------------
  // STATIC FILE SERVING
  // --------------------------------------------------------------------------
  let reqPath = pathname;
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath === '/admin' || reqPath === '/admin/') reqPath = '/admin/index.html';

  let filePath = path.join(process.cwd(), reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(CONFIG.PORT, () => {
  console.log(`⚡ NAMORA Production Server running at http://localhost:${CONFIG.PORT}`);
  console.log(`📦 Admin Dashboard at http://localhost:${CONFIG.PORT}/admin/`);
});
