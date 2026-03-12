// ============================================================================
// lib/check-domain.ts — Server-Side Domain Reachability Check
// ============================================================================

export interface CheckResult {
  domain: string;
  reachable: boolean;
  status_code: number | null;
  latency_ms: number;
  error: string | null;
  checked_at: string;
}

/**
 * Normalize raw user input into a clean domain.
 * Strips protocol, path, query, fragment, port, whitespace.
 */
export function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/[/:?#].*$/, "");
  d = d.replace(/\s+/g, "");
  return d;
}

/**
 * Validate that a string looks like a plausible domain.
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain);
}

/**
 * Perform a real server-side HTTP check against a domain.
 * Measures latency, captures status code, handles timeouts.
 */
export async function checkDomain(rawDomain: string): Promise<CheckResult> {
  const domain = normalizeDomain(rawDomain);

  if (!isValidDomain(domain)) {
    return {
      domain,
      reachable: false,
      status_code: null,
      latency_ms: 0,
      error: "Invalid domain format",
      checked_at: new Date().toISOString(),
    };
  }

  const url = `https://${domain}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "WebsiteDown/1.0 (+https://websitedown.com/bot)",
        "Accept": "*/*",
      },
    });

    const latency = Math.round(performance.now() - start);
    const reachable = res.status < 500;

    return {
      domain,
      reachable,
      status_code: res.status,
      latency_ms: latency,
      error: reachable ? null : `HTTP ${res.status}`,
      checked_at: new Date().toISOString(),
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);

    // Try HTTP fallback if HTTPS fails
    try {
      const httpRes = await fetch(`http://${domain}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
        headers: { "User-Agent": "WebsiteDown/1.0" },
      });

      const httpLatency = Math.round(performance.now() - start);
      return {
        domain,
        reachable: httpRes.status < 500,
        status_code: httpRes.status,
        latency_ms: httpLatency,
        error: httpRes.status >= 500 ? `HTTP ${httpRes.status}` : null,
        checked_at: new Date().toISOString(),
      };
    } catch {
      // Both HTTPS and HTTP failed
    }

    let error = "Could not reach server";
    if (err.name === "AbortError") error = "Request timed out (10s)";
    else if (err.cause?.code === "ENOTFOUND") error = "DNS lookup failed";
    else if (err.cause?.code === "ECONNREFUSED") error = "Connection refused";
    else if (err.cause?.code === "ECONNRESET") error = "Connection reset";
    else if (err.message) error = err.message.slice(0, 120);

    return {
      domain,
      reachable: false,
      status_code: null,
      latency_ms: latency,
      error,
      checked_at: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
