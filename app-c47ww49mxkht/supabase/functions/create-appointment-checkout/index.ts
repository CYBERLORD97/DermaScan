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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });

  // Auth
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : { data: { user: null } };

  if (!user) return fail("Authentication required", 401);

  let body: {
    dermatologistId: string;
    appointmentDate: string;
    appointmentTime: string;
    paymentProvider: "stripe" | "paystack";
    notes?: string;
  };

  try {
    body = await req.json();
    if (!body.dermatologistId || !body.appointmentDate || !body.appointmentTime || !body.paymentProvider) {
      throw new Error("Missing required fields");
    }
  } catch (e) {
    return fail((e as Error).message);
  }

  // Fetch dermatologist & fee from DB (never trust client-side price)
  const { data: derm, error: dermError } = await supabase
    .from("dermatologists")
    .select("id, name, consultation_fee_naira, is_active")
    .eq("id", body.dermatologistId)
    .eq("is_active", true)
    .maybeSingle();

  if (dermError || !derm) return fail("Dermatologist not found or unavailable");

  const feeNaira = Number(derm.consultation_fee_naira);
  const origin = req.headers.get("origin") || "";

  if (body.paymentProvider === "stripe") {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return fail("Stripe is not configured. Please add STRIPE_SECRET_KEY.", 500);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create pending order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        items: [{ name: `Consultation: Dr. ${derm.name}`, price: feeNaira, quantity: 1 }],
        total_amount: feeNaira,
        currency: "ngn",
        status: "pending",
      })
      .select()
      .single();

    if (orderErr) return fail(`Failed to create order: ${orderErr.message}`, 500);

    // Create appointment (pending payment)
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        dermatologist_id: body.dermatologistId,
        order_id: order.id,
        appointment_date: body.appointmentDate,
        appointment_time: body.appointmentTime,
        status: "pending_payment",
        payment_provider: "stripe",
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (apptErr) return fail(`Failed to create appointment: ${apptErr.message}`, 500);

    // Stripe checkout session — NGN in kobo (smallest unit)
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "ngn",
          product_data: {
            name: `Dermatology Consultation — Dr. ${derm.name}`,
            description: `${body.appointmentDate} at ${body.appointmentTime}`,
          },
          unit_amount: Math.round(feeNaira * 100), // kobo
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appt.id}`,
      cancel_url: `${origin}/book-appointment`,
      metadata: {
        order_id: order.id,
        appointment_id: appt.id,
        user_id: user.id,
      },
    });

    // Save session ID to order
    await supabase.from("orders").update({
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
    }).eq("id", order.id);

    return ok({ provider: "stripe", url: session.url, sessionId: session.id, appointmentId: appt.id, orderId: order.id });
  }

  // Paystack flow
  const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!paystackKey) return fail("Paystack is not configured. Please add PAYSTACK_SECRET_KEY.", 500);

  // Get user email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  const email = profile?.email || user.email || "customer@dermascan.app";

  const reference = `DS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Create pending order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      items: [{ name: `Consultation: Dr. ${derm.name}`, price: feeNaira, quantity: 1 }],
      total_amount: feeNaira,
      currency: "ngn",
      status: "pending",
    })
    .select()
    .single();

  if (orderErr) return fail(`Failed to create order: ${orderErr.message}`, 500);

  // Create appointment
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      dermatologist_id: body.dermatologistId,
      order_id: order.id,
      appointment_date: body.appointmentDate,
      appointment_time: body.appointmentTime,
      status: "pending_payment",
      payment_provider: "paystack",
      paystack_reference: reference,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (apptErr) return fail(`Failed to create appointment: ${apptErr.message}`, 500);

  // Initialize Paystack transaction
  const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(feeNaira * 100), // kobo
      currency: "NGN",
      reference,
      callback_url: `${origin}/payment-success?provider=paystack&reference=${reference}&appointment_id=${appt.id}`,
      metadata: { order_id: order.id, appointment_id: appt.id, user_id: user.id },
    }),
  });

  const psData = await psRes.json();
  if (!psData.status) return fail(`Paystack error: ${psData.message}`, 500);

  return ok({
    provider: "paystack",
    url: psData.data.authorization_url,
    reference,
    appointmentId: appt.id,
    orderId: order.id,
  });
});
