import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const rawBody = await req.text();

    if (secret && signature) {
      const hmac = createHmac("sha256", secret);
      hmac.update(rawBody);
      const expectedSignature = hmac.toString();
      if (expectedSignature !== signature) {
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      if (payment) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Idempotency check
        const { data: existing } = await supabaseClient
          .from("payments")
          .select("id")
          .eq("provider_payment_id", payment.id);

        if (!existing || existing.length === 0) {
          console.log(`Webhook: recorded captured payment ${payment.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});
