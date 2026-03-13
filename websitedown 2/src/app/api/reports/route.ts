// src/app/api/reports/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

const VALID_TYPES = ["down", "working"];
const VALID_ISSUES = ["login", "app", "website", "api", "connection"];
const DEDUP_WINDOW_SEC = 300; // 5 min per domain per fingerprint

export async function POST(req: NextRequest) {
  // Rate limit: 10 reports per minute per IP
  const ip = getClientIP(req.headers);
  if (!rateLimit(`report:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { domain, report_type, issue_type } = body;

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }
  if (!VALID_TYPES.includes(report_type)) {
    return NextResponse.json({ error: "Invalid report_type" }, { status: 400 });
  }
  if (issue_type && !VALID_ISSUES.includes(issue_type)) {
    return NextResponse.json({ error: "Invalid issue_type" }, { status: 400 });
  }

  // Normalize domain
  const d = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

  // Domain format validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  // Generate anonymous fingerprint from IP + UA
  const ua = req.headers.get("user-agent") || "";
  const fingerprint = await hashFP(ip + ua);

  try {
    // Dedup: check if already reported in last 5 min
    const existing = await db.query(
      `SELECT 1 FROM outage_reports WHERE domain = $1 AND fingerprint = $2 AND created_at > NOW() - INTERVAL '${DEDUP_WINDOW_SEC} seconds' LIMIT 1`,
      [d, fingerprint]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ status: "already_reported" });
    }

    // Extract geo from edge headers (free on Netlify/Vercel)
    const country = req.headers.get("x-country") || req.headers.get("x-nf-country-code") || null;
    const region = req.headers.get("x-region") || null;
    const city = req.headers.get("x-city") || req.headers.get("x-nf-client-connection-city") || null;

    await db.query(
      `INSERT INTO outage_reports (domain, report_type, issue_type, country, region, city, fingerprint) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [d, report_type, issue_type || null, country, region, city, fingerprint]
    );

    return NextResponse.json({ status: "reported" });
  } catch (err: any) {
    console.error("[reports] DB error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function hashFP(input: string): Promise<string> {
  const salt = process.env.FINGERPRINT_SALT || "wd-default-salt-change-me";
  const data = new TextEncoder().encode(input + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
