// src/app/api/cron/snapshot/route.ts
// Called every 5 minutes via QStash or Netlify Scheduled Functions

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SERVICES } from "@/config/services";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const m = now.getUTCMinutes();
  const windowStart = new Date(now);
  windowStart.setUTCMinutes(m - (m % 5), 0, 0);
  const ws = windowStart.toISOString();

  const active = await db.query(
    `SELECT DISTINCT domain FROM outage_reports WHERE created_at > NOW()-INTERVAL '10 minutes'`
  );
  const domains = [...new Set([...SERVICES.map(s => s.domain), ...active.rows.map((r: any) => r.domain)])];

  let snapped = 0;
  for (const domain of domains) {
    const counts = await db.query(`
      SELECT COUNT(*) FILTER (WHERE report_type='down')::int as down,
        COUNT(*) FILTER (WHERE report_type='working')::int as working
      FROM outage_reports
      WHERE domain=$1 AND created_at >= $2 AND created_at < $2::timestamptz + INTERVAL '5 minutes'
    `, [domain, ws]);
    const { down, working } = counts.rows[0];
    if (down > 0 || working > 0) {
      await db.query(`
        INSERT INTO report_snapshots (domain, window_start, reports_down, reports_working)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (domain, window_start) DOUPDATE SET reports_down=$3, reports_working=$4
      `, [domain, ws, down, working]);
      snapped++;
    }
  }
  return NextResponse.json({ snapped, window: ws });
}
