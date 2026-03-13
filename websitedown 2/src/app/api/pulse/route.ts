// src/app/api/pulse/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SERVICES } from "@/config/services";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req.headers);
  if (!rateLimit(`pulse:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const domain = req.nextUrl.searchParams.get("domain");

  try {
    if (domain) {
      const pulse = await getDomainPulse(domain.toLowerCase());
      return NextResponse.json(pulse, {
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      });
    }

    // All tracked services
    const pulses = await Promise.all(SERVICES.map(s => getDomainPulse(s.domain)));
    return NextResponse.json(
      { services: pulses, updated_at: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (err: any) {
    console.error("[pulse] Error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function getDomainPulse(domain: string) {
  // Reports from snapshots (pre-aggregated, fast)
  const [r15m, r1h, r24h] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(reports_down),0)::int as down, COALESCE(SUM(reports_working),0)::int as working FROM report_snapshots WHERE domain=$1 AND window_start > NOW()-INTERVAL '15 minutes'`, [domain]),
    db.query(`SELECT COALESCE(SUM(reports_down),0)::int as down, COALESCE(SUM(reports_working),0)::int as working FROM report_snapshots WHERE domain=$1 AND window_start > NOW()-INTERVAL '1 hour'`, [domain]),
    db.query(`SELECT COALESCE(SUM(reports_down),0)::int as down, COALESCE(SUM(reports_working),0)::int as working FROM report_snapshots WHERE domain=$1 AND window_start > NOW()-INTERVAL '24 hours'`, [domain]),
  ]);

  // 24h sparkline (one point per hour)
  const sparkline = await db.query(`
    SELECT date_trunc('hour', window_start) as hour, SUM(reports_down)::int as down
    FROM report_snapshots
    WHERE domain=$1 AND window_start > NOW()-INTERVAL '24 hours'
    GROUP BY 1 ORDER BY 1
  `, [domain]);

  // Baseline for current time
  const now = new Date();
  const baseline = await db.query(
    `SELECT avg_reports_15m, avg_reports_1h FROM report_baselines WHERE domain=$1 AND hour_of_day=$2 AND day_of_week=$3`,
    [domain, now.getUTCHours(), now.getUTCDay()]
  );

  const current15m = r15m.rows[0]?.down || 0;
  const baseline15m = parseFloat(baseline.rows[0]?.avg_reports_15m || "0") || 1;
  const spikeRatio = baseline15m > 0 ? current15m / baseline15m : (current15m > 5 ? current15m : 0);

  // Top issue type (from raw reports, last 1h â small query)
  const topIssue = await db.query(
    `SELECT issue_type, COUNT(*)::int as cnt FROM outage_reports WHERE domain=$1 AND created_at > NOW()-INTERVAL '1 hour' AND issue_type IS NOT NULL GROUP BY issue_type ORDER BY cnt DESC LIMIT 1`,
    [domain]
  );

  // Top country
  const topCountry = await db.query(
    `SELECT country, COUNT(*)::int as cnt FROM outage_reports WHERE domain=$1 AND created_at > NOW()-INTERVAL '1 hour' AND country IS NOT NULL GROUP BY country ORDER BY cnt DESC LIMIT 1`,
    [domain]
  );

  return {
    domain,
    reports_15m: current15m,
    reports_1h: r1h.rows[0]?.down || 0,
    reports_24h: r24h.rows[0]?.down || 0,
    confirmations_1h: r1h.rows[0]?.working || 0,
    baseline_15m: Math.round(baseline15m),
    spike_ratio: Math.round(spikeRatio * 10) / 10,
    anomaly_level: getAnomalyLevel(spikeRatio, current15m),
    top_issue: topIssue.rows[0]?.issue_type || null,
    top_country: topCountry.rows[0]?.country || null,
    sparkline_24h: sparkline.rows.map((r: any) => ({ hour: r.hour, reports: r.down })),
    updated_at: new Date().toISOString(),
  };
}

function getAnomalyLevel(ratio: number, absolute: number): string {
  if (absolute < 3) return "none";
  if (ratio >= 10 || absolute >= 100) return "high";
  if (ratio >= 4 || absolute >= 30) return "elevated";
  if (ratio >= 2 || absolute >= 10) return "moderate";
  return "none";
}
