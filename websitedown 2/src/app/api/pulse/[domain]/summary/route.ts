// src/app/api/pulse/[domain]/summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const ip = getClientIP(req.headers);
  if (!rateLimit(`summary:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { domain } = await params;
  const BASE = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://websitedown.com";

  let pulse: any;
  try {
    const res = await fetch(`${BASE}/api/pulse?domain=${encodeURIComponent(domain)}`);
    pulse = await res.json();
  } catch {
    return NextResponse.json({ summary: "Unable to fetch pulse data.", source: "error" });
  }

  if (process.env.PERPLEXITY_API_KEY) {
    try {
      const prompt = `Summarize the current outage status for ${domain}:
- Reports in last 15 min: ${pulse.reports_15m} (baseline: ${pulse.baseline_15m})
- Reports in last hour: ${pulse.reports_1h}
- Spike ratio: ${pulse.spike_ratio}x above normal
- Anomaly level: ${pulse.anomaly_level}
- Top issue type: ${pulse.top_issue || "not specified"}
- Top affected region: ${pulse.top_country || "unknown"}
- Positive confirmations: ${pulse.confirmations_1h} in last hour
Write 1-2 sentences. Be specific. Reference actual numbers.`;

      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "sonar", max_tokens: 200, temperature: 0.1, messages: [ { role: "system", content: "You write concise, factual 1-2 sentence outage status summaries. No speculation. Plain English." }, { role: "user", content: prompt } ] }),
      });
      const data = await res.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (summary) {
        return NextResponse.json({ summary, source: "ai" }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
      }
    } catch {}
  }

  return NextResponse.json(
    { summary: fallbackSummary(domain, pulse), source: "rule-based" },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}

function fallbackSummary(domain: string, p: any): string {
  const { anomaly_level, reports_15m, spike_ratio, top_issue, reports_1h } = p;
  if (anomaly_level === "none" || reports_15m < 3) return `No significant outage reports for ${domain}. The service appears to be operating normally.`;
  if (anomaly_level === "moderate") return `Slightly elevated reports for ${domain} -- ${reports_15m} in the last 15 minutes (${spike_ratio}x normal).${top_issue ? ` Most reports mention ${top_issue} issues.` : ""}`;
  if (anomaly_level === "elevated") return `Reports are elevated for ${domain} with ${reports_1h} in the past hour, ${spike_ratio}x above baseline.${top_issue ? ` Users are primarily reporting ${top_issue} problems.` : ""}`;
  return `Reports are spiking well above normal for ${domain} -- ${reports_15m} reports in the last 15 minutes (${spike_ratio}x baseline).${top_issue ? ` Most complaints relate to ${top_issue} failures.` : ""} A significant outage appears likely.`;
}
