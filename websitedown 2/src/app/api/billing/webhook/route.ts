// POST /api/billing/webhook — Stripe webhook handler

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  // Verify webhook signature using HMAC-SHA256
  const verified = await verifyStripeSignature(body, sig, webhookSecret);
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const planId = session.metadata?.plan_id;
      if (userId && planId) {
        await db.query(
          "UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3",
          [planId, session.subscription, userId]
        );
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      if (sub.status === "active") {
        // Plan might have changed
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = priceId === process.env.STRIPE_PRICE_PRO_PLUS ? "pro_plus" : "pro";
        await db.query(
          "UPDATE users SET plan = $1 WHERE stripe_subscription_id = $2",
          [plan, sub.id]
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db.query(
        "UPDATE users SET plan = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = $1",
        [sub.id]
      );
      // Deactivate monitors over free limit (0)
      const userResult = await db.query(
        "SELECT id FROM users WHERE stripe_subscription_id IS NULL AND plan = 'free'"
      );
      for (const u of userResult.rows) {
        await db.query("UPDATE monitors SET is_active = false WHERE user_id = $1", [(u as any).id]);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  try {
    const parts = sig.split(",").reduce((acc, part) => {
      const [k, v] = part.split("=");
      acc[k.trim()] = v;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const v1 = parts["v1"];
    if (!timestamp || !v1) return false;

    // Check timestamp (allow 5 min tolerance)
    const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (age > 300) return false;

    const payload = `${timestamp}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig_bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = [...new Uint8Array(sig_bytes)].map(b => b.toString(16).padStart(2, "0")).join("");

    return expected === v1;
  } catch {
    return false;
  }
}
