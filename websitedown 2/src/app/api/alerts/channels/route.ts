// GET /api/alerts/channels — list user's alert channels
// POST /api/alerts/channels — add alert channel

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.query(
    "SELECT id, type, config, is_active, created_at FROM alert_channels WHERE user_id = $1 ORDER BY created_at",
    [user.sub]
  );
  return NextResponse.json({ channels: result.rows });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req.headers.get("cookie"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = getPlan(user.plan as string);
  if (plan.channelLimit === 0) {
    return NextResponse.json({ error: "Upgrade to Pro to add alert channels" }, { status: 403 });
  }

  const countResult = await db.query("SELECT COUNT(*)::int AS c FROM alert_channels WHERE user_id = $1", [user.sub]);
  if ((countResult.rows[0] as any).c >= plan.channelLimit) {
    return NextResponse.json({ error: `Channel limit reached (${plan.channelLimit})` }, { status: 403 });
  }

  const { type, config } = await req.json();

  if (!["email", "telegram", "discord"].includes(type)) {
    return NextResponse.json({ error: "Invalid channel type" }, { status: 400 });
  }

  // Validate config based on type
  if (type === "email" && (!config?.email || !config.email.includes("@"))) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (type === "telegram" && !config?.chat_id) {
    return NextResponse.json({ error: "Telegram chat_id required" }, { status: 400 });
  }
  if (type === "discord" && (!config?.webhook_url || !config.webhook_url.startsWith("https://discord.com/api/webhooks/"))) {
    return NextResponse.json({ error: "Valid Discord webhook URL required" }, { status: 400 });
  }

  const result = await db.query(
    "INSERT INTO alert_channels (user_id, type, config) VALUES ($1, $2, $3) RETURNING id, type, config, is_active, created_at",
    [user.sub, type, JSON.stringify(config)]
  );

  return NextResponse.json({ channel: result.rows[0] }, { status: 201 });
}
