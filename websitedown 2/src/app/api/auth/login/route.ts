import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, authCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const result = await db.query(
      "SELECT id, email, password_hash, plan FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0] as { id: string; email: string; password_hash: string; plan: string };
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({ sub: user.id, email: user.email, plan: user.plan });

    const res = NextResponse.json({ id: user.id, email: user.email, plan: user.plan });
    res.headers.set("Set-Cookie", authCookie(token));
    return res;
  } catch (err: any) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
