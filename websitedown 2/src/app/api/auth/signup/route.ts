import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, authCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    if (typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check for existing user
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const result = await db.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, plan, created_at",
      [email.toLowerCase().trim(), hash]
    );

    const user = result.rows[0] as { id: string; email: string; plan: string };
    const token = await signToken({ sub: user.id, email: user.email, plan: user.plan });

    const res = NextResponse.json({ id: user.id, email: user.email, plan: user.plan });
    res.headers.set("Set-Cookie", authCookie(token));
    return res;
  } catch (err: any) {
    console.error("[auth/signup]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
