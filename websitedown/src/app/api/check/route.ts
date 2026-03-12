import { NextRequest, NextResponse } from "next/server";
import { checkDomain, normalizeDomain, isValidDomain } from "@/lib/check-domain";

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

  const result = await checkDomain(domain);

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
  });
}
