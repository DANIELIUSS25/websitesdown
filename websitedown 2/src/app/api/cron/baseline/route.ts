// src/app/api/cron/baseline/route.ts
// Called once daily at 4 AM UTC via QStash or Netlify Scheduled Functions

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Recompute baselines from last 14 days of snapshots
  await db.query(`
    INSERT INTO report_baselines (domain, hour_of_day, day_of_week, avg_reports_15m, avg_reports_1h, sample_days, updated_at)
    SELECT
      domain,
      EXTRACT(HOUR FROM window_start)::int,
      EXTRACT(DOW FROM window_start)::int,
      ROUND(AVG(reports_down) * 3, 2),
      ROUND(AVG(reports_down) * 12, 2),
      COUNT(DISTINCT DATE(window_start))::int,
      NOW()
    FROM report_snapshots
    WHERE window_start > NOW() - INTERVAL '14 days'
    GROUP BY domain, EXTRACT(HOUR FROM window_start)::int, EXTRACT(DOW FROM window_start)::int
    ON CONFLICT (domain, hour_of_day, day_of_week) DO UPDATE SET
      avg_reports_15m = EXCLUDED.avg_reports_15m,
      avg_reports_1h = EXCLUDED.avg_reports_1h,
      sample_days = EXCLUDED.sample_days,
      updated_at = NOW()
  `);

  // Cleanup old data (30-day retention)
  const deleted = await db.query(`DELETE FROM outage_reports WHERE created_at < NOW()-INTERVAL '30 days'`);
  await db.query(`DELETE FROM report_snapshots WHERE window_start < NOW()-INTERVAL '30 days'`);

  return NextResponse.json({ status: "baselines_updated", purged_reports: deleted.rowCount });
}
