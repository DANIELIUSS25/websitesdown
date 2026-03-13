// GET /api/monitors/[id] — get monitor detail with recent checks
// PUT /api/monitors/[id] — update monitor (toggle active, change domain)
// DELETE /api/monitors/[id] — delete monitor

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const monResult = await db.query(
    "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
    [id, user.sub]
  );
  if (monResult.rows.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const monitor = monResult.rows[0];

  // Recent checks (last 24h)
  const checksResult = await db.query(
    `SELECT status, status_code, latency_ms, error, checked_at
     FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '24 hours'
     ORDER BY checked_at DESC LIMIT 1440`,
    [id]
  );

  // Incidents
  const incidentsResult = await db.query(
    `SELECT id, started_at, resolved_at, cause
     FROM incidents WHERE monitor_id = $1 ORDER BY started_at DESC LIMIT 50`,
    [id]
  );

  // Uptime stats
  const statsResult = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '24 hours')::int AS total_24h,
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '24 hours' AND status = 'up')::int AS up_24h,
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '7 days')::int AS total_7d,
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '7 days' AND status = 'up')::int AS up_7d,
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '30 days')::int AS total_30d,
       (SELECT COUNT(*) FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '30 days' AND status = 'up')::int AS up_30d`,
    [id]
  );

  const s = statsResult.rows[0] as any;

  return NextResponse.json({
    monitor,
    checks: checksResult.rows,
    incidents: incidentsResult.rows,
    uptime: {
      "24h": s.total_24h > 0 ? Math.round((s.up_24h / s.total_24h) * 10000) / 100 : null,
      "7d": s.total_7d > 0 ? Math.round((s.up_7d / s.total_7d) * 10000) / 100 : null,
      "30d": s.total_30d > 0 ? Math.round((s.up_30d / s.total_30d) * 10000) / 100 : null,
    },
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  // Verify ownership
  const existing = await db.query("SELECT id FROM monitors WHERE id = $1 AND user_id = $2", [id, user.sub]);
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (typeof body.is_active === "boolean") {
    updates.push(`is_active = $${idx++}`);
    params.push(body.is_active);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  params.push(id);
  const result = await db.query(
    `UPDATE monitors SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  return NextResponse.json({ monitor: result.rows[0] });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const result = await db.query(
    "DELETE FROM monitors WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, user.sub]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
