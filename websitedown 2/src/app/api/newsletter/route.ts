// POST /api/newsletter — Subscribe email to newsletter
// GET  /api/newsletter?token=... — Confirm double opt-in

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import crypto from "crypto";

export const runtime = "nodejs";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req.headers);
  if (!rateLimit(`newsletter:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    // Check if already subscribed
    const existing = await db.query(
      "SELECT id, confirmed FROM newsletter_subscribers WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].confirmed) {
        return NextResponse.json({ message: "You're already subscribed!" });
      }
      // Resend confirmation — update token
      const token = crypto.randomBytes(32).toString("hex");
      await db.query(
        "UPDATE newsletter_subscribers SET confirm_token = $1, created_at = NOW() WHERE email = $2",
        [token, email]
      );
      await sendConfirmationEmail(email, token);
      return NextResponse.json({ message: "Confirmation email resent. Check your inbox." });
    }

    // Insert new subscriber
    const token = crypto.randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO newsletter_subscribers (email, confirm_token) VALUES ($1, $2)",
      [email, token]
    );

    // Send confirmation email if configured, otherwise auto-confirm
    const emailSent = await sendConfirmationEmail(email, token);
    if (!emailSent) {
      // No email service configured — auto-confirm
      await db.query(
        "UPDATE newsletter_subscribers SET confirmed = true, confirmed_at = NOW() WHERE email = $1",
        [email]
      );
      return NextResponse.json({ message: "You're subscribed! We'll notify you about major outages." });
    }

    return NextResponse.json({ message: "Check your email to confirm your subscription." });
  } catch (err: any) {
    console.error("[newsletter] Error:", err.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Invalid confirmation link." }, { status: 400 });
  }

  try {
    const result = await db.query(
      "UPDATE newsletter_subscribers SET confirmed = true, confirmed_at = NOW(), confirm_token = NULL WHERE confirm_token = $1 AND confirmed = false RETURNING email",
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Link expired or already confirmed." }, { status: 400 });
    }

    // Redirect to homepage with success message
    return NextResponse.redirect(new URL("/?subscribed=1", req.url));
  } catch (err: any) {
    console.error("[newsletter] Confirm error:", err.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

async function sendConfirmationEmail(email: string, token: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return false;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://websitedown.com";
  const confirmUrl = `${baseUrl}/api/newsletter?token=${token}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "WebsiteDown <alerts@websitedown.com>",
        to: email,
        subject: "Confirm your WebsiteDown subscription",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;">
            <h2 style="font-size:20px;font-weight:700;margin-bottom:16px;">Confirm your subscription</h2>
            <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:24px;">
              You requested to receive outage alerts and monitoring updates from WebsiteDown.
              Click the button below to confirm your email.
            </p>
            <a href="${confirmUrl}" style="display:inline-block;padding:12px 28px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;">
              Confirm Subscription
            </a>
            <p style="font-size:12px;color:#999;margin-top:24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
