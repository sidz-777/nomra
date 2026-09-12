/**
 * NAMORA — SUPABASE CLIENT & BACKEND BRIDGE
 * Production-ready client integration with graceful offline / pre-config fallback
 */
(function() {
  let supabaseClient = null;

  function initSupabase() {
    if (supabaseClient) return supabaseClient;
    
    const config = window.NAMORA_SUPABASE_CONFIG || {};
    const url = config.SUPABASE_URL && config.SUPABASE_URL.trim();
    const key = config.SUPABASE_ANON_KEY && config.SUPABASE_ANON_KEY.trim();

    // Check if Supabase SDK is available and keys are provided
    if (window.supabase && typeof window.supabase.createClient === 'function' && url && key && url.startsWith('http')) {
      try {
        supabaseClient = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        console.log('⚡ NAMORA: Connected to Supabase Backend successfully.');
        return supabaseClient;
      } catch (err) {
        console.warn('⚠️ NAMORA: Supabase initialization failed, falling back to direct mode:', err.message);
      }
    }
    return null;
  }

  // Generate clean human-readable order number (e.g. NAM-8429)
  function generateOrderNumber() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return 'NAM-' + randomDigits;
  }

  /**
   * Save customer order to Supabase
   * @param {Object} orderData - Customer details, totals, and payment info
   * @param {Array} items - Array of cart item objects
   * @returns {Promise<{success: boolean, orderNumber: string, orderId?: string, isFallback?: boolean}>}
   */
  async function createSupabaseOrder(orderData, items) {
    const orderNumber = orderData.orderNumber || generateOrderNumber();
    const client = initSupabase();

    if (!client) {
      console.log('ℹ️ NAMORA: Supabase credentials not set or offline. Using local order flow (' + orderNumber + ')');
      return {
        success: true,
        orderNumber: orderNumber,
        isFallback: true
      };
    }

    try {
      // 1. Insert into orders table
      const { data: orderRecord, error: orderErr } = await client
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_name: orderData.customerName || 'Valued Customer',
          phone: orderData.phone || '',
          address: orderData.address || '',
          pincode: orderData.pincode || '',
          total_amount: orderData.totalAmount || 499.00,
          deposit_amount: orderData.depositAmount || 49.00,
          cod_amount: orderData.codAmount || 450.00,
          status: 'pending_advance',
          payment_method: orderData.paymentMethod || 'deposit_cod',
          payment_status: 'unpaid'
        }])
        .select('id, order_number')
        .single();

      if (orderErr) {
        console.warn('⚠️ NAMORA: Order insert failed in Supabase:', orderErr.message);
        return { success: true, orderNumber: orderNumber, isFallback: true };
      }

      const orderId = orderRecord.id;

      // 2. Insert order items if present
      if (items && items.length) {
        const itemRows = items.map(item => ({
          order_id: orderId,
          product_id: item.productId || item.id || 'custom-frame',
          product_title: item.productTitle || 'NAMORA Frame',
          product_image: item.productImage || '',
          is_ready_made: !!item.isReadyMade,
          category_label: item.categoryLabel || (item.isReadyMade ? 'Ready-to-Ship' : 'Custom Calligraphy'),
          english_name: item.englishName || '',
          arabic_name: item.arabicName || '',
          ink_style: item.inkLabel || 'Obsidian Black',
          font_style: item.fontLabel || 'Classic',
          text_size: item.textSizeLabel || 'Balanced',
          has_gift: !!item.gift,
          gift_to: (item.gift && item.gift.to) || '',
          gift_from: (item.gift && item.gift.from) || '',
          gift_message: (item.gift && item.gift.message) || '',
          gift_price: item.gift ? (item.gift.cost || 69.00) : 0.00,
          price: item.price || 499.00,
          deposit: item.deposit || 49.00,
          cod: item.cod || 450.00
        }));

        const { error: itemsErr } = await client
          .from('order_items')
          .insert(itemRows);

        if (itemsErr) {
          console.warn('⚠️ NAMORA: Order items insert warning:', itemsErr.message);
        }
      }

      console.log('✅ NAMORA: Order #' + orderNumber + ' saved to Supabase successfully!');
      return {
        success: true,
        orderNumber: orderNumber,
        orderId: orderId,
        isFallback: false
      };
    } catch (err) {
      console.warn('⚠️ NAMORA: Unexpected error creating order in Supabase:', err.message);
      return {
        success: true,
        orderNumber: orderNumber,
        isFallback: true
      };
    }
  }

  /**
   * Track order by Order Number (e.g. NAM-8421) or 10-digit customer phone
   * @param {string} query
   * @returns {Promise<{found: boolean, order?: Object, items?: Array}>}
   */
  async function trackSupabaseOrder(query) {
    const client = initSupabase();
    if (!client) return { found: false, isFallback: true };

    const cleanQuery = (query || '').trim();
    if (!cleanQuery) return { found: false };

    try {
      let req = client
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          phone,
          status,
          payment_status,
          courier_name,
          tracking_number,
          tracking_url,
          total_amount,
          deposit_amount,
          cod_amount,
          created_at,
          order_items (
            product_title,
            product_image,
            english_name,
            arabic_name,
            ink_style,
            is_ready_made
          )
        `);

      if (cleanQuery.toUpperCase().startsWith('NAM-')) {
        req = req.eq('order_number', cleanQuery.toUpperCase());
      } else {
        // Query by phone (last 10 digits or exact match)
        const digits = cleanQuery.replace(/\D/g, '');
        const searchPhone = digits.length >= 10 ? digits.slice(-10) : digits;
        req = req.ilike('phone', '%' + searchPhone + '%');
      }

      const { data, error } = await req.order('created_at', { ascending: false }).limit(1);

      if (error || !data || !data.length) {
        return { found: false };
      }

      const order = data[0];
      return {
        found: true,
        order: order,
        items: order.order_items || []
      };
    } catch (err) {
      console.warn('⚠️ NAMORA: Tracking lookup error:', err.message);
      return { found: false };
    }
  }

  // Expose to window
  window.NamoraBackend = {
    getClient: initSupabase,
    createOrder: createSupabaseOrder,
    trackOrder: trackSupabaseOrder,
    generateOrderNumber: generateOrderNumber
  };
})();
