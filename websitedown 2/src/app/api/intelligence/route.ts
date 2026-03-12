import { NextRequest, NextResponse } from "next/server";
import { normalizeDomain, isValidDomain } from "@/lib/check-domain";
import { getOutageIntelligence } from "@/lib/perplexity-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("domain");

  if (!raw) {
    return NextResponse.json({ error: "Missing 'domain' parameter" }, { status: 400 });
  }

  const domain = normalizeDomain(raw);

  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain", domain }, { status: 422 });
  }

  const intelligence = await getOutageIntelligence(domain);

  return NextResponse.json(
    { domain, ...intelligence },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
