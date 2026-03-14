// src/app/api/reports/summary/route.ts
// Aggregation endpoint returning report counts for a domain.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = getClientIP(req.headers);
  if (!rateLimit(`report-summary:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const d = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE report_type = 'down' AND created_at > NOW() - INTERVAL '15 minutes')::int AS reports_15m,
        COUNT(*) FILTER (WHERE report_type = 'down' AND created_at > NOW() - INTERVAL '1 hour')::int AS reports_1h,
        COUNT(*) FILTER (WHERE report_type = 'down' AND created_at > NOW() - INTERVAL '24 hours')::int AS reports_24h,
        COUNT(*) FILTER (WHERE report_type = 'working' AND created_at > NOW() - INTERVAL '1 hour')::int AS working_confirmations
      FROM outage_reports
      WHERE domain = $1 AND created_at > NOW() - INTERVAL '24 hours'
    `, [d]);

    const row = result.rows[0] || {};

    return NextResponse.json({
      domain: d,
      reports_15m: row.reports_15m ?? 0,
      reports_1h: row.reports_1h ?? 0,
      reports_24h: row.reports_24h ?? 0,
      working_confirmations: row.working_confirmations ?? 0,
    }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (err: any) {
    console.error("[reports/summary]", err.message);
    return NextResponse.json({
      domain: d,
      reports_15m: 0,
      reports_1h: 0,
      reports_24h: 0,
      working_confirmations: 0,
    }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  }
}
