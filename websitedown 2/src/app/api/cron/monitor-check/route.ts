// POST /api/cron/monitor-check — Check all due monitors, record results, send alerts
// Called every 60 seconds by external cron (e.g. Netlify scheduled function, cron-job.org)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendAlert } from "@/lib/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all active monitors that are due (checked > 60s ago or never checked)
  // Only include monitors for users with pro/pro_plus plans
  const monitorsResult = await db.query(
    `SELECT m.id, m.domain, m.last_status, m.user_id
     FROM monitors m
     JOIN users u ON u.id = m.user_id
     WHERE m.is_active = true
       AND u.plan IN ('pro', 'pro_plus')
       AND (m.last_checked_at IS NULL OR m.last_checked_at < NOW() - INTERVAL '55 seconds')
     LIMIT 100`
  );

  const monitors = monitorsResult.rows as { id: string; domain: string; last_status: string | null; user_id: string }[];
  const results: { id: string; domain: string; status: string }[] = [];

  // Check each monitor
  await Promise.all(monitors.map(async (mon) => {
    const { status, status_code, latency_ms, error } = await checkDomain(mon.domain);

    // Record the check
    await db.query(
      "INSERT INTO monitor_checks (monitor_id, status, status_code, latency_ms, error) VALUES ($1, $2, $3, $4, $5)",
      [mon.id, status, status_code, latency_ms, error]
    );

    // Update monitor
    await db.query(
      "UPDATE monitors SET last_status = $1, last_checked_at = NOW() WHERE id = $2",
      [status, mon.id]
    );

    results.push({ id: mon.id, domain: mon.domain, status });

    // Detect state change → send alerts
    if (mon.last_status && mon.last_status !== status) {
      if (status === "down") {
        // Create incident
        await db.query(
          "INSERT INTO incidents (monitor_id, cause) VALUES ($1, $2)",
          [mon.id, error || "Site unreachable"]
        );
        await sendAlerts(mon.user_id, mon.domain, "down", error);
      } else if (status === "up" && mon.last_status === "down") {
        // Resolve incident
        const incResult = await db.query(
          `UPDATE incidents SET resolved_at = NOW()
           WHERE monitor_id = $1 AND resolved_at IS NULL
           RETURNING started_at`,
          [mon.id]
        );
        const downtime = incResult.rows.length > 0
          ? formatDuration(new Date().getTime() - new Date((incResult.rows[0] as any).started_at).getTime())
          : undefined;
        await sendAlerts(mon.user_id, mon.domain, "recovered", null, downtime);
      }
    }
  }));

  return NextResponse.json({ checked: results.length, results });
}

async function checkDomain(domain: string): Promise<{ status: string; status_code: number | null; latency_ms: number; error: string | null }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "WebsiteDown-Monitor/1.0" },
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return { status: "up", status_code: res.status, latency_ms: latency, error: null };
  } catch (err: any) {
    const latency = Date.now() - start;
    if (err.name === "AbortError") {
      return { status: "down", status_code: null, latency_ms: latency, error: "Timeout (10s)" };
    }
    return { status: "down", status_code: null, latency_ms: latency, error: err.message || "Unreachable" };
  }
}

async function sendAlerts(userId: string, domain: string, alertStatus: "down" | "recovered", error?: string | null, downtime?: string) {
  try {
    const channelsResult = await db.query(
      "SELECT type, config FROM alert_channels WHERE user_id = $1 AND is_active = true",
      [userId]
    );
    const channels = channelsResult.rows as { type: string; config: any }[];

    await Promise.all(channels.map(ch =>
      sendAlert(
        { type: ch.type as any, config: typeof ch.config === "string" ? JSON.parse(ch.config) : ch.config },
        { domain, status: alertStatus, error, downtime }
      )
    ));
  } catch (err) {
    console.error("[cron/monitor-check] Alert send error:", err);
  }
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
