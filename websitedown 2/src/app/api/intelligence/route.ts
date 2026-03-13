// src/app/api/intelligence/route.ts
// SECURITY FIX: Added rate limiting (15 requests/min per IP) + referer check

import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain, isValidDomain } from "@/lib/check-domain";
import { getOutageIntelligence } from "@/lib/perplexity-intelligence";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Rate limit: 15 intel requests per minute per IP (Perplexity costs money)
  const ip = getClientIP(req.headers);
  if (!rateLimit(`intel:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Rate limited. Max 15 requests per minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Basic referer check (stops casual scraping, not determined attackers)
  const referer = req.headers.get("referer") || "";
  const origin = req.headers.get("origin") || "";
  const isLocal = referer.includes("localhost") || origin.includes("localhost");
  const isSelf = referer.includes("websitedown.com") || origin.includes("websitedown.com");
  if (!isLocal && !isSelf && referer !== "") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = req.nextUrl.searchParams.get("domain");

  if (!raw) {
    return NextResponse.json({ error: "Missing 'domain' parameter" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);

  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain", domain }, { status: 422 });
  }

  const result = await getOutageIntelligence(domain);

  return NextResponse.json({
    domain,
    summary: result.summary,
    confidence: result.confidence,
    issue_type: result.issue_type,
    signals: result.signals,
    sources: result.sources,
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
