// POST /api/billing/checkout — Create Stripe checkout session

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Billing not configured" }, { status: 500 });

  const { plan: planId } = await req.json();
  if (!planId || !["pro", "pro_plus"].includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId as PlanId];
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: "Stripe price not configured for this plan" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Get or create Stripe customer
  let customerId: string;
  const userResult = await db.query("SELECT stripe_customer_id FROM users WHERE id = $1", [user.sub]);
  const existingCustomerId = (userResult.rows[0] as any)?.stripe_customer_id;

  if (existingCustomerId) {
    customerId = existingCustomerId;
  } else {
    const customerRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: user.email as string, "metadata[user_id]": user.sub as string }),
    });
    const customer = await customerRes.json();
    customerId = customer.id;
    await db.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, user.sub]);
  }

  // Create checkout session
  const params = new URLSearchParams({
    "mode": "subscription",
    "customer": customerId,
    "line_items[0][price]": plan.stripePriceId,
    "line_items[0][quantity]": "1",
    "success_url": `${siteUrl}/dashboard?upgraded=true`,
    "cancel_url": `${siteUrl}/pricing`,
    "metadata[user_id]": user.sub as string,
    "metadata[plan_id]": planId,
  });

  const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const session = await sessionRes.json();

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
