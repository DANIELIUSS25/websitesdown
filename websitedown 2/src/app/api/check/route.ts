// src/app/api/check/route.ts
// SECURITY FIX: Added rate limiting (30 requests/min per IP)

import { NextRequest, NextResponse } from "next/server";
import { checkDomain, normalizeDomain, isValidDomain } from "@/lib/check-domain";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Rate limit: 30 checks per minute per IP
  const ip = getClientIP(req.headers);
  if (!rateLimit(`check:${ip}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Rate limited. Max 30 requests per minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const raw = req.nextUrl.searchParams.get("domain");

  if (!raw) {
    return NextResponse.json({ error: "Missing 'domain' parameter" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);

  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain", domain }, { status: 422 });
  }

  const result = await checkDomain(domain);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
  });
}
