import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@19.1.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function ok(data: unknown): Response {
  return new Response(JSON.stringify({ code: "SUCCESS", data }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function fail(msg: string, code = 400): Response {
  return new Response(JSON.stringify({ code: "FAIL", message: msg }), {
    status: code,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function confirmAppointment(appointmentId: string, orderId: string) {
  // Optimistic lock: only update if still pending_payment
  await supabase.from("appointments")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("status", "pending_payment");

  await supabase.from("orders")
    .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });

  let body: { sessionId?: string; reference?: string; appointmentId: string; provider: "stripe" | "paystack" };
  try {
    body = await req.json();
    if (!body.appointmentId || !body.provider) throw new Error("Missing required fields");
  } catch (e) {
    return fail((e as Error).message);
  }

  // Fetch appointment + order
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .select("id, status, order_id, paystack_reference")
    .eq("id", body.appointmentId)
    .maybeSingle();

  if (apptErr || !appt) return fail("Appointment not found");
  if (appt.status === "confirmed") {
    return ok({ verified: true, status: "confirmed", alreadyConfirmed: true });
  }

  if (body.provider === "stripe") {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return fail("Stripe not configured", 500);
    if (!body.sessionId) return fail("Missing sessionId");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);

    if (session.payment_status !== "paid") {
      return ok({ verified: false, status: session.payment_status });
    }

    await confirmAppointment(appt.id, appt.order_id);

    return ok({
      verified: true,
      status: "paid",
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email,
    });
  }

  // Paystack verification
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!paystackKey) return fail("Paystack not configured", 500);
  const reference = body.reference || appt.paystack_reference;
  if (!reference) return fail("Missing Paystack reference");

  const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackKey}` },
  });

  const psData = await psRes.json();
  if (!psData.status || psData.data?.status !== "success") {
    return ok({ verified: false, status: psData.data?.status ?? "unknown" });
  }

  await confirmAppointment(appt.id, appt.order_id);

  return ok({
    verified: true,
    status: "paid",
    reference,
    amount: psData.data.amount,
    currency: psData.data.currency,
    customerEmail: psData.data.customer?.email,
  });
});
