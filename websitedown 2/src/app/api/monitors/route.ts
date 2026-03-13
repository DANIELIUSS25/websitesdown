// GET /api/monitors — list user's monitors
// POST /api/monitors — create a new monitor

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain } from "@/lib/check-domain";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query(
    `SELECT m.id, m.domain, m.is_active, m.last_status, m.last_checked_at, m.created_at,
       (SELECT COUNT(*) FROM monitor_checks mc WHERE mc.monitor_id = m.id AND mc.status = 'up' AND mc.checked_at > NOW() - INTERVAL '24 hours')::int AS checks_up_24h,
       (SELECT COUNT(*) FROM monitor_checks mc WHERE mc.monitor_id = m.id AND mc.checked_at > NOW() - INTERVAL '24 hours')::int AS checks_total_24h
     FROM monitors m WHERE m.user_id = $1 ORDER BY m.created_at DESC`,
    [user.sub]
  );

  const monitors = result.rows.map((m: any) => ({
    ...m,
    uptime_24h: m.checks_total_24h > 0 ? Math.round((m.checks_up_24h / m.checks_total_24h) * 10000) / 100 : null,
  }));

  return NextResponse.json({ monitors });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getPlan(user.plan as string);
  if (plan.monitorLimit === 0) {
    return NextResponse.json({ error: "Upgrade to Pro to add monitors" }, { status: 403 });
  }

  // Check monitor count
  const countResult = await db.query("SELECT COUNT(*)::int AS c FROM monitors WHERE user_id = $1", [user.sub]);
  const count = (countResult.rows[0] as any).c;
  if (count >= plan.monitorLimit) {
    return NextResponse.json({ error: `Monitor limit reached (${plan.monitorLimit}). Upgrade your plan.` }, { status: 403 });
  }

  const { domain: raw } = await req.json();
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Domain required" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);
  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 422 });
  }

  // Check for duplicate
  const dup = await db.query("SELECT id FROM monitors WHERE user_id = $1 AND domain = $2", [user.sub, domain]);
  if (dup.rows.length > 0) {
    return NextResponse.json({ error: "Already monitoring this domain" }, { status: 409 });
  }

  const result = await db.query(
    "INSERT INTO monitors (user_id, domain) VALUES ($1, $2) RETURNING id, domain, is_active, created_at",
    [user.sub, domain]
  );

  return NextResponse.json({ monitor: result.rows[0] }, { status: 201 });
}
