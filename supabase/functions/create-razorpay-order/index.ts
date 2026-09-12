import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { order_id, deposit_amount } = await req.json();

    let amount = parseFloat(deposit_amount) || 49.00;

    // Verify deposit amount against order in database
    if (order_id) {
      const { data: order, error: orderErr } = await supabaseClient
        .from("orders")
        .select("deposit_amount, order_number")
        .eq("id", order_id)
        .single();

      if (order && !orderErr) {
        amount = parseFloat(order.deposit_amount);
      }
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_namora";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    let razorpayOrderId = "order_" + Math.random().toString(36).substring(2, 15);

    // Call live Razorpay API if secret is provided
    if (keySecret) {
      const auth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "INR",
          receipt: order_id || "receipt_" + Date.now(),
        }),
      });

      const rzpData = await rzpRes.json();
      if (rzpData.id) {
        razorpayOrderId = rzpData.id;
      }
    }

    if (order_id) {
      await supabaseClient
        .from("orders")
        .update({ razorpay_order_id: razorpayOrderId })
        .eq("id", order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        razorpay_order_id: razorpayOrderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        key_id: keyId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
