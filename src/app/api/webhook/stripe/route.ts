import crypto from "crypto";
import { NextResponse } from "next/server";
import { EventSource, FounderEventKind } from "@/lib/pet-engine";
import { recordFounderEvent } from "@/lib/pet-store";

export const dynamic = "force-dynamic";

function safeEqual(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyStripeSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const actual = parts.v1;
  if (!timestamp || !actual) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return safeEqual(expected, actual);
}

function amountToUsdLike(object: any): number {
  const cents = object.amount_received ?? object.amount_paid ?? object.amount_total ?? object.amount;
  if (typeof cents === "number" && Number.isFinite(cents)) return Math.max(0, cents / 100);
  if (typeof object.amount === "string") return Math.max(0, Number(object.amount));
  return 0;
}

function userIdFromStripeObject(object: any): string {
  return (
    object.metadata?.founderpet_user_id ??
    object.metadata?.userId ??
    object.metadata?.user_id ??
    object.client_reference_id ??
    object.customer_email ??
    "demo"
  ).toString();
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid Stripe signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supported = new Set(["checkout.session.completed", "payment_intent.succeeded", "invoice.paid", "charge.succeeded"]);
  if (!supported.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: true, type: event.type });
  }

  const object = event.data?.object ?? {};
  const value = amountToUsdLike(object);
  if (value <= 0) return NextResponse.json({ ok: true, ignored: true, reason: "zero_amount", type: event.type });

  const result = await recordFounderEvent({
    userId: userIdFromStripeObject(object),
    kind: FounderEventKind.REVENUE,
    source: EventSource.STRIPE,
    value,
    currency: String(object.currency ?? "usd").toUpperCase(),
    verified: true,
    confidence: 1,
    externalId: event.id ?? object.id,
    occurredAt: event.created ? new Date(event.created * 1000).toISOString() : new Date().toISOString(),
    metadata: {
      stripeType: event.type,
      stripeObjectId: object.id ?? null,
      product: object.metadata?.product ?? null,
    },
  });

  return NextResponse.json({ ok: true, duplicate: result.duplicate, event: result.event, pet: result.state.snapshot });
}
