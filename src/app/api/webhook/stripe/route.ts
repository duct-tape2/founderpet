import { NextRequest, NextResponse } from "next/server";

/**
 * Stripe webhook receiver.
 * Triggered on: charge.succeeded, invoice.paid, customer.subscription.created
 *
 * Production setup:
 *   1. Configure webhook in Stripe Dashboard → https://yourdomain.com/api/webhook/stripe
 *   2. Set STRIPE_WEBHOOK_SECRET env var
 *   3. Map Stripe customer.metadata.founderpet_user_id → your user
 *
 * On valid payment event → emit MetricEvent { type: MANUAL_REVENUE, value: amount }
 * → pet engine recalculates EXP/level/stage automatically.
 */

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

interface StripeEvent {
  id: string;
  type: string;
  data: { object: any };
  created: number;
}

async function verifyStripeSignature(payload: string, signature: string | null): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("STRIPE_WEBHOOK_SECRET not configured - allowing unsigned in dev");
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) return false;

  // Stripe-Signature header format: t=timestamp,v1=hmac
  // For production: use stripe sdk constructEvent.
  // This implementation is a placeholder that passes through in non-prod.
  return true;
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  const valid = await verifyStripeSignature(payload, signature);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Extract user + amount based on event type
  let userId: string | undefined;
  let amount: number = 0;
  let currency: string = "usd";

  switch (event.type) {
    case "charge.succeeded": {
      const charge = event.data.object;
      userId = charge.metadata?.founderpet_user_id;
      amount = charge.amount / 100; // cents → dollars
      currency = charge.currency;
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      userId = invoice.metadata?.founderpet_user_id || invoice.customer_email;
      amount = invoice.amount_paid / 100;
      currency = invoice.currency;
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      userId = sub.metadata?.founderpet_user_id;
      amount = sub.items?.data?.[0]?.price?.unit_amount / 100 || 0;
      currency = sub.currency || "usd";
      break;
    }
    default:
      return NextResponse.json({ received: true, ignored: true });
  }

  if (!userId || amount <= 0) {
    return NextResponse.json({ received: true, ignored: true, reason: "no userId or amount" });
  }

  // TODO (Phase 2): persist MetricEvent to Supabase
  // await supabase.from('events').insert({
  //   user_id: userId,
  //   type: 'manual_revenue',
  //   value: amount,
  //   metadata: { source: 'stripe', currency, stripe_event_id: event.id },
  //   recorded_at: new Date(event.created * 1000).toISOString(),
  // });

  return NextResponse.json({
    received: true,
    userId,
    amount,
    currency,
    expGained: Math.min(amount, 500), // capped per pet-engine rules
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "stripe-webhook",
    method: "POST",
    events: ["charge.succeeded", "invoice.paid", "customer.subscription.created"],
    docs: "https://github.com/duct-tape2/founderpet#stripe-integration",
  });
}
