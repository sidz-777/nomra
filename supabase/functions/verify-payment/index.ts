import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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

    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method,
    } = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    let isSignatureValid = false;
    if (keySecret) {
      const hmac = createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const expectedSignature = hmac.toString();
      isSignatureValid = (expectedSignature === razorpay_signature);
    } else {
      isSignatureValid = razorpay_payment_id && (razorpay_payment_id.startsWith("pay_") || razorpay_payment_id.length > 5);
    }

    if (!isSignatureValid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call atomic verify_order_payment RPC in Supabase
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
      "verify_order_payment",
      {
        p_order_id: order_id,
        p_provider_order_id: razorpay_order_id,
        p_provider_payment_id: razorpay_payment_id,
        p_amount: 49.00,
        p_method: method || "upi",
      }
    );

    if (rpcError) {
      throw new Error(rpcError.message);
    }

    return new Response(
      JSON.stringify(rpcData || { success: true, status: "advance_paid" }),
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
