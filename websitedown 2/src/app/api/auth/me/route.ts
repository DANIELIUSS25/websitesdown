import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req.headers.get("cookie"));
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const result = await db.query(
      "SELECT id, email, plan, stripe_customer_id, created_at FROM users WHERE id = $1",
      [payload.sub]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch {
    return NextResponse.json({ user: payload });
  }
}
