// src/lib/alerts.ts — Send alerts via email, telegram, discord webhook

interface AlertPayload {
  domain: string;
  status: "down" | "recovered";
  error?: string | null;
  latency_ms?: number;
  downtime?: string; // e.g. "5m 32s"
}

interface ChannelConfig {
  type: "email" | "telegram" | "discord";
  config: Record<string, string>;
}

export async function sendAlert(channel: ChannelConfig, payload: AlertPayload): Promise<boolean> {
  try {
    switch (channel.type) {
      case "email": return await sendEmail(channel.config, payload);
      case "telegram": return await sendTelegram(channel.config, payload);
      case "discord": return await sendDiscord(channel.config, payload);
      default: return false;
    }
  } catch (err) {
    console.error(`[alerts] Failed to send ${channel.type} alert:`, err);
    return false;
  }
}

// --- Email (via Resend API) ---

async function sendEmail(config: Record<string, string>, payload: AlertPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn("[alerts] RESEND_API_KEY not set"); return false; }

  const isDown = payload.status === "down";
  const subject = isDown
    ? `🔴 ${payload.domain} is DOWN`
    : `🟢 ${payload.domain} has RECOVERED`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="padding:16px 20px;border-radius:8px;background:${isDown ? "#fef2f2" : "#f0fdf4"};border:1px solid ${isDown ? "#fecaca" : "#bbf7d0"};">
        <h2 style="margin:0 0 8px;font-size:18px;color:${isDown ? "#dc2626" : "#16a34a"};">${subject}</h2>
        <p style="margin:0;color:#374151;font-size:14px;">
          ${isDown
            ? `Your monitored site <strong>${payload.domain}</strong> is not responding.${payload.error ? ` Error: ${payload.error}` : ""}`
            : `Your monitored site <strong>${payload.domain}</strong> is back online.${payload.downtime ? ` Downtime: ${payload.downtime}` : ""}`
          }
        </p>
      </div>
      <p style="margin-top:16px;font-size:11px;color:#9ca3af;">Sent by WebsiteDown.com</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "WebsiteDown <alerts@websitedown.com>",
      to: [config.email],
      subject,
      html,
    }),
  });
  return res.ok;
}

// --- Telegram ---

async function sendTelegram(config: Record<string, string>, payload: AlertPayload): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) { console.warn("[alerts] TELEGRAM_BOT_TOKEN not set"); return false; }

  const isDown = payload.status === "down";
  const text = isDown
    ? `🔴 *${payload.domain}* is DOWN\n${payload.error ? `Error: ${payload.error}` : "Site is not responding."}`
    : `🟢 *${payload.domain}* has RECOVERED\n${payload.downtime ? `Downtime: ${payload.downtime}` : "Site is back online."}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: config.chat_id, text, parse_mode: "Markdown" }),
  });
  return res.ok;
}

// --- Discord Webhook ---

async function sendDiscord(config: Record<string, string>, payload: AlertPayload): Promise<boolean> {
  const isDown = payload.status === "down";

  const res = await fetch(config.webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: isDown ? `🔴 ${payload.domain} is DOWN` : `🟢 ${payload.domain} has RECOVERED`,
        description: isDown
          ? `Site is not responding.${payload.error ? ` Error: ${payload.error}` : ""}`
          : `Site is back online.${payload.downtime ? ` Downtime: ${payload.downtime}` : ""}`,
        color: isDown ? 0xf87171 : 0x34d399,
        timestamp: new Date().toISOString(),
        footer: { text: "WebsiteDown.com" },
      }],
    }),
  });
  return res.ok;
}
