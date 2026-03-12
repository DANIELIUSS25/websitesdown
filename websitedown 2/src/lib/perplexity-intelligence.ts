// ============================================================================
// lib/perplexity-intelligence.ts — AI Web Intelligence for Outage Detection
// ============================================================================
// Calls Perplexity's sonar model with a structured prompt to detect
// real-time outage signals across the web. Returns structured JSON.
//
// If Perplexity is unavailable or returns garbage, fails gracefully
// so the frontend still shows the direct check result.
// ============================================================================

export interface OutageSignal {
  summary: string;
  confidence: "none" | "low" | "medium" | "high";
  issue_type: string | null;
  signals: string[];
  sources: { title: string; url: string }[];
  powered_by: "perplexity";
}

const FALLBACK: OutageSignal = {
  summary: "Unable to gather web intelligence at this time.",
  confidence: "none",
  issue_type: null,
  signals: [],
  sources: [],
  powered_by: "perplexity",
};

// ---------------------------------------------------------------------------
// Prompt — optimized for structured outage detection
// ---------------------------------------------------------------------------

function buildPrompt(domain: string): string {
  return `You are an outage detection analyst. Investigate whether the website/service "${domain}" is currently experiencing any downtime, service degradation, or operational issues.

Search the live web for recent signals including:
- Outage reports from users on social media (Twitter/X, Reddit, etc.)
- Status page updates from the service itself
- News articles about current issues
- Discussion threads about connectivity problems
- Reports of login failures, API errors, slow performance, or regional outages

Based on what you find, respond with ONLY a JSON object (no markdown, no backticks, no explanation) in this exact format:

{
  "summary": "One clear sentence describing the current status based on web signals",
  "confidence": "none|low|medium|high",
  "issue_type": "The specific type of issue if any, or null",
  "signals": ["Signal 1", "Signal 2", "Signal 3"],
  "sources": [{"title": "Source name", "url": "https://..."}]
}

Rules:
- "confidence" must be exactly one of: "none", "low", "medium", "high"
- "none" = no outage signals found, service appears operational
- "low" = minor scattered reports, probably not a real outage
- "medium" = multiple consistent signals suggesting real issues
- "high" = strong evidence of widespread outage or major disruption
- "issue_type" examples: "service disruption", "login failures", "API errors", "DNS issues", "regional outage", "degraded performance", "scheduled maintenance", null
- "signals" should be 2-5 short factual observations from the web, not opinions
- "sources" should include 1-3 actual URLs you found, with short titles
- If no outage signals exist, say so clearly with confidence "none"
- Do not fabricate signals. Only report what you actually find.
- Be concise. Each signal should be one sentence max.

Respond with ONLY the JSON object.`;
}

// ---------------------------------------------------------------------------
// Call Perplexity API
// ---------------------------------------------------------------------------

export async function getOutageIntelligence(
  domain: string
): Promise<OutageSignal> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.warn("[intelligence] PERPLEXITY_API_KEY not set");
    return FALLBACK;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a precise outage detection system. You ONLY respond with valid JSON. Never use markdown formatting.",
          },
          {
            role: "user",
            content: buildPrompt(domain),
          },
        ],
        temperature: 0.1,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[intelligence] Perplexity API error: ${res.status}`);
      return FALLBACK;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[intelligence] Empty response from Perplexity");
      return FALLBACK;
    }

    // Parse the JSON response — strip markdown fences if present
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate structure
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : FALLBACK.summary,
      confidence: ["none", "low", "medium", "high"].includes(parsed.confidence)
        ? parsed.confidence
        : "none",
      issue_type: typeof parsed.issue_type === "string" ? parsed.issue_type : null,
      signals: Array.isArray(parsed.signals)
        ? parsed.signals.filter((s: any) => typeof s === "string").slice(0, 5)
        : [],
      sources: Array.isArray(parsed.sources)
        ? parsed.sources
            .filter((s: any) => typeof s?.title === "string" && typeof s?.url === "string")
            .slice(0, 3)
        : [],
      powered_by: "perplexity",
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("[intelligence] Perplexity request timed out");
    } else if (err instanceof SyntaxError) {
      console.error("[intelligence] Failed to parse Perplexity response as JSON");
    } else {
      console.error("[intelligence] Perplexity error:", err.message);
    }
    return FALLBACK;
  }
}
