import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SERVICES } from "@/config/services";

export const runtime = "nodejs";

export async function GET() {
  try {
    const now = new Date();

    // 1) Live checks — parallel fetch all services
    const checks = await Promise.allSettled(
      SERVICES.slice(0, 30).map(async (svc) => {
        const base = process.env.URL || "https://websitedown.com";
        const r = await fetch(`${base}/api/check?domain=${encodeURIComponent(svc.domain)}`, {
          next: { revalidate: 30 },
        });
        if (!r.ok) return { domain: svc.domain, name: svc.name, reachable: null, latency_ms: null, status_code: null };
        return r.json();
      })
    );

    const serviceStatus = checks.map((c, i) => {
      const svc = SERVICES[i];
      const data = c.status === "fulfilled" ? c.value : null;
      return {
        domain: svc.domain,
        name: svc.name,
        category: svc.category || null,
        reachable: data?.reachable ?? null,
        latency_ms: data?.latency_ms ?? null,
        status_code: data?.status_code ?? null,
        status: data?.reachable === false ? "down"
          : data?.latency_ms > 3000 ? "degraded"
          : data?.reachable === true ? "operational"
          : "unknown",
      };
    });

    // 2) Report pulse data (if DB available)
    let pulseData: any[] = [];
    let recentIncidents: any[] = [];
    let globalStats = { total_services: SERVICES.length, operational: 0, degraded: 0, down: 0, unknown: 0 };

    serviceStatus.forEach(s => {
      if (s.status === "operational") globalStats.operational++;
      else if (s.status === "degraded") globalStats.degraded++;
      else if (s.status === "down") globalStats.down++;
      else globalStats.unknown++;
    });

    try {
      // Get report pulse for all services
      const pulse = await db.query(`
        SELECT
          domain,
          COUNT(*) FILTER (WHERE report_type='down' AND created_at > NOW()-INTERVAL '15 minutes')::int as reports_15m,
          COUNT(*) FILTER (WHERE report_type='down' AND created_at > NOW()-INTERVAL '1 hour')::int as reports_1h,
          COUNT(*) FILTER (WHERE report_type='down' AND created_at > NOW()-INTERVAL '24 hours')::int as reports_24h,
          COUNT(*) FILTER (WHERE report_type='working' AND created_at > NOW()-INTERVAL '1 hour')::int as confirmations_1h
        FROM outage_reports
        WHERE created_at > NOW()-INTERVAL '24 hours'
        GROUP BY domain
        ORDER BY reports_1h DESC
      `);
      pulseData = pulse.rows as any[];

      // Get hourly sparklines for top services
      const sparklines = await db.query(`
        SELECT domain, date_trunc('hour', window_start) as hour, SUM(reports_down)::int as reports
        FROM report_snapshots
        WHERE window_start > NOW()-INTERVAL '24 hours'
        GROUP BY domain, 1
        ORDER BY domain, 1
      `);

      // Group sparklines by domain
      const sparkMap: Record<string, number[]> = {};
      for (const row of sparklines.rows as any[]) {
        if (!sparkMap[row.domain]) sparkMap[row.domain] = [];
        sparkMap[row.domain].push(row.reports);
      }

      // Attach sparklines to pulse data
      pulseData = pulseData.map(p => ({
        ...p,
        sparkline: sparkMap[p.domain] || [],
      }));

      // Get baselines for anomaly detection
      const baselines = await db.query(`
        SELECT domain, avg_reports_15m
        FROM report_baselines
        WHERE hour_of_day = $1 AND day_of_week = $2
      `, [now.getUTCHours(), now.getUTCDay()]);

      const blMap: Record<string, number> = {};
      for (const row of baselines.rows as any[]) {
        blMap[row.domain] = parseFloat(row.avg_reports_15m) || 1;
      }

      // Compute anomaly levels
      pulseData = pulseData.map(p => {
        const baseline = blMap[p.domain] || 1;
        const ratio = p.reports_15m / baseline;
        let anomaly = "normal";
        if (p.reports_15m >= 100 || ratio >= 10) anomaly = "major";
        else if (p.reports_15m >= 20 || ratio >= 3) anomaly = "elevated";
        return { ...p, baseline_15m: Math.round(baseline), spike_ratio: Math.round(ratio * 10) / 10, anomaly };
      });

    } catch (e: any) {
      // DB not available — continue with check data only
      console.warn("[status] DB unavailable:", e.message);
    }

    // 3) Build current outages list
    const outages = serviceStatus
      .filter(s => s.status === "down")
      .map(s => {
        const pulse = pulseData.find(p => p.domain === s.domain);
        return { ...s, reports_1h: pulse?.reports_1h || 0, anomaly: pulse?.anomaly || "normal" };
      });

    // 4) Trending — services with elevated or major reports
    const trending = pulseData
      .filter(p => p.anomaly !== "normal" || p.reports_1h > 0)
      .sort((a, b) => {
        const order: Record<string, number> = { major: 0, elevated: 1, normal: 2 };
        const diff = (order[a.anomaly] ?? 3) - (order[b.anomaly] ?? 3);
        return diff !== 0 ? diff : b.reports_1h - a.reports_1h;
      })
      .slice(0, 10);

    return NextResponse.json({
      services: serviceStatus,
      outages,
      trending,
      pulse: pulseData,
      stats: globalStats,
      generated_at: now.toISOString(),
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e: any) {
    console.error("[status api]", e.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
