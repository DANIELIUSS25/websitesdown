// GET /api/monitors/[id]/checks?range=24h|7d|30d — check history

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
  const range = req.nextUrl.searchParams.get("range") || "24h";

  // Verify ownership
  const mon = await db.query("SELECT id FROM monitors WHERE id = $1 AND user_id = $2", [id, user.sub]);
  if (mon.rows.length === 0) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const intervalMap: Record<string, string> = { "24h": "24 hours", "7d": "7 days", "30d": "30 days" };
  const interval = intervalMap[range] || "24 hours";

  // For 7d/30d, aggregate by hour to reduce payload
  if (range === "7d" || range === "30d") {
    const result = await db.query(
      `SELECT
         date_trunc('hour', checked_at) AS hour,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'up')::int AS up,
         ROUND(AVG(latency_ms))::int AS avg_latency
       FROM monitor_checks
       WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '${interval}'
       GROUP BY hour ORDER BY hour DESC`,
      [id]
    );
    return NextResponse.json({ checks: result.rows, aggregated: true });
  }

  // 24h: return individual checks
  const result = await db.query(
    `SELECT status, status_code, latency_ms, error, checked_at
     FROM monitor_checks WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '${interval}'
     ORDER BY checked_at DESC`,
    [id]
  );

  return NextResponse.json({ checks: result.rows, aggregated: false });
}
