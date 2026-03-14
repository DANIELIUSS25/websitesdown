// src/app/api/outages/route.ts
// Returns current outage data for tracked services.
// Format: { services: [{ service, domain, status, reports_15m, reports_1h, baseline, anomaly_level, trend, sparkline_24h }], generated_at }

import { NextResponse } from "next/server";
import { SERVICES } from "@/config/services";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Deterministic seed-based RNG for consistent demo sparklines per domain
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 2147483647;
  };
}

function generateDemoSparkline(domain: string): number[] {
  const rng = seededRandom(domain);
  const hours = 24;
  const points: number[] = [];
  let base = Math.floor(rng() * 8) + 2;

  for (let i = 0; i < hours; i++) {
    const noise = Math.floor(rng() * 6) - 2;
    const spike = rng() > 0.88 ? Math.floor(rng() * 40) + 15 : 0;
    points.push(Math.max(0, base + noise + spike));
    base = Math.max(1, base + Math.floor(rng() * 3) - 1);
  }
  return points;
}

export async function GET() {
  try {
    const now = new Date();
    const BASE = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://websitedown.com";

    // 1) Parallel health checks for top services
    const top = SERVICES.slice(0, 20);
    const checks = await Promise.allSettled(
      top.map(async (svc) => {
        const r = await fetch(`${BASE}/api/check?domain=${encodeURIComponent(svc.domain)}`, {
          next: { revalidate: 30 },
        });
        if (!r.ok) return { domain: svc.domain, reachable: null, latency_ms: null, status_code: null };
        return r.json();
      })
    );

    // 2) Report pulse data from DB
    let reportData: Record<string, { reports_15m: number; reports_1h: number; baseline: number; anomaly_level: string }> = {};
    let sparklineData: Record<string, number[]> = {};
    let hasDbData = false;

    try {
      const pulse = await db.query(`
        SELECT
          domain,
          COUNT(*) FILTER (WHERE report_type='down' AND created_at > NOW()-INTERVAL '15 minutes')::int as reports_15m,
          COUNT(*) FILTER (WHERE report_type='down' AND created_at > NOW()-INTERVAL '1 hour')::int as reports_1h
        FROM outage_reports
        WHERE created_at > NOW()-INTERVAL '24 hours'
        GROUP BY domain
      `);

      const baselines = await db.query(
        `SELECT domain, avg_reports_15m FROM report_baselines WHERE hour_of_day = $1 AND day_of_week = $2`,
        [now.getUTCHours(), now.getUTCDay()]
      );

      const blMap: Record<string, number> = {};
      for (const row of baselines.rows as any[]) {
        blMap[row.domain] = parseFloat(row.avg_reports_15m) || 1;
      }

      for (const row of pulse.rows as any[]) {
        const baseline = blMap[row.domain] || 1;
        const ratio = row.reports_15m / baseline;
        let anomaly_level = "normal";
        if (row.reports_15m >= 100 || ratio >= 10) anomaly_level = "major";
        else if (row.reports_15m >= 20 || ratio >= 3) anomaly_level = "elevated";

        reportData[row.domain] = {
          reports_15m: row.reports_15m,
          reports_1h: row.reports_1h,
          baseline: Math.round(baseline),
          anomaly_level,
        };
      }

      // Fetch sparklines from DB
      const sparklines = await db.query(`
        SELECT domain, date_trunc('hour', window_start) as hour, SUM(reports_down)::int as down
        FROM report_snapshots
        WHERE window_start > NOW()-INTERVAL '24 hours'
        GROUP BY domain, 1 ORDER BY domain, 1
      `);

      for (const row of sparklines.rows as any[]) {
        if (!sparklineData[row.domain]) sparklineData[row.domain] = [];
        sparklineData[row.domain].push(row.down || 0);
      }

      hasDbData = true;
    } catch {
      // DB not available — continue with health check data + demo sparklines
    }

    // 2b) Fetch latest report timestamps per domain
    let lastReportMap: Record<string, string> = {};
    try {
      const lastReports = await db.query(`
        SELECT domain, MAX(created_at) as last_at
        FROM outage_reports
        WHERE report_type = 'down' AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY domain
      `);
      for (const row of lastReports.rows as any[]) {
        lastReportMap[row.domain] = row.last_at;
      }
    } catch { /* DB not available */ }

    // 3) Build service list
    const services = top.map((svc, i) => {
      const data = checks[i].status === "fulfilled" ? (checks[i] as PromiseFulfilledResult<any>).value : null;
      const reachable = data?.reachable ?? null;
      const latency = data?.latency_ms ?? null;

      let status: "operational" | "degraded" | "down" | "unknown" = "unknown";
      if (reachable === false) status = "down";
      else if (latency && latency > 3000) status = "degraded";
      else if (reachable === true) status = "operational";

      const pulse = reportData[svc.domain];
      const reports_15m = pulse?.reports_15m ?? 0;
      const reports_1h = pulse?.reports_1h ?? 0;
      const baseline = pulse?.baseline ?? 0;
      const anomaly_level = pulse?.anomaly_level ?? "normal";

      // Derive trend from anomaly_level and status
      let trend: "stable" | "rising" | "spike" = "stable";
      if (anomaly_level === "major" || status === "down") trend = "spike";
      else if (anomaly_level === "elevated" || status === "degraded") trend = "rising";

      // Use DB sparkline if available, otherwise generate demo data
      const sparkline_24h = sparklineData[svc.domain]?.length
        ? sparklineData[svc.domain]
        : generateDemoSparkline(svc.domain);

      // Determine signal sources
      const signal_sources: string[] = [];
      if (reports_15m > 0 || reports_1h > 0) signal_sources.push("user_reports");
      if (status === "down" || status === "degraded") signal_sources.push("error_spikes");
      if (anomaly_level !== "normal") signal_sources.push("ai_signals");

      // Trend percentage change vs baseline
      const trend_pct = baseline > 0 ? Math.round(((reports_15m - baseline) / baseline) * 100) : 0;

      return {
        service: svc.name,
        domain: svc.domain,
        category: svc.category,
        status,
        latency_ms: latency,
        reports_15m,
        reports_1h,
        baseline,
        anomaly_level,
        trend,
        trend_pct,
        sparkline_24h,
        signal_sources,
        last_report_at: lastReportMap[svc.domain] || null,
      };
    });

    // 4) Active outages: down or elevated/major reports
    const outages = services.filter(
      s => s.status === "down" || s.status === "degraded" || s.anomaly_level !== "normal"
    );

    return NextResponse.json({
      services,
      outages,
      total: services.length,
      operational: services.filter(s => s.status === "operational").length,
      issues: outages.length,
      generated_at: now.toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e: any) {
    console.error("[outages api]", e.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
