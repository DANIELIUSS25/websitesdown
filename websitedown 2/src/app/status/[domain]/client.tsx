"use client";
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { tokens } from "@/lib/design-tokens";

type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] } | null;
type RelatedService = { domain: string; name: string; iconKey: string };
type ReportSummary = { reports_15m: number; reports_1h: number; reports_24h: number; working_confirmations: number };
type PulseData = { reports_15m: number; reports_1h: number; reports_24h: number; baseline_15m: number; sparkline_24h: { hour: string; reports: number }[] };

const S = { ...tokens, void: tokens.bg };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

interface Props {
  domain: string; name: string; category: string | null; iconKey: string | null;
  statusPageUrl: string | null; initialCheck: CheckResult | null; initialIntel: IntelResult;
  related: RelatedService[];
}

export default function StatusPageClient({ domain, name, category, statusPageUrl, initialCheck, initialIntel, related }: Props) {
  const [check, setCheck] = useState<CheckResult | null>(initialCheck);
  const [intel, setIntel] = useState<IntelResult>(initialIntel);
  const [checking, setChecking] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [reportSent, setReportSent] = useState<"down" | "working" | null>(null);
  const [showIssueTypes, setShowIssueTypes] = useState(false);
  const [pulse, setPulse] = useState<PulseData | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const r = await fetch(`/api/reports/summary?domain=${encodeURIComponent(domain)}`);
      if (r.ok) setReportSummary(await r.json());
    } catch { /* silent */ }
  }, [domain]);

  async function submitReport(type: "down" | "working", issueType?: string) {
    setReportSent(type);
    setShowIssueTypes(false);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, report_type: type, issue_type: issueType || undefined }),
      });
      fetchSummary();
    } catch { /* silent */ }
  }

  useEffect(() => {
    recheck(); fetchSummary();
    fetch(`/api/pulse?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setPulse(d); }).catch(() => {});
  }, [domain, fetchSummary]);
  async function recheck() {
    setChecking(true);
    setIntelLoading(true);
    // Parallel: server check + AI intelligence
    const checkPromise = fetch(`/api/check?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[status] Recheck failed:", err); return null; });
    const intelPromise = fetch(`/api/intelligence?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[status] Intel fetch failed:", err); return null; });
    const checkResult = await checkPromise;
    if (checkResult) setCheck(checkResult);
    setChecking(false);
    const intelResult = await intelPromise;
    if (intelResult) setIntel(intelResult);
    setIntelLoading(false);
  }
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const d = query.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
    if (d) window.location.href = `/status/${d}`;
  }
  const up = check?.reachable;
  const color = up === undefined ? S.t4 : up ? (check!.latency_ms > 2000 ? S.warn : S.up) : S.dn;
  const label = up === undefined ? "Unknown" : up ? (check!.latency_ms > 2000 ? "Slow" : "Operational") : "Down";
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", maxWidth: 980, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, fontFamily: S.sans, letterSpacing: "-0.04em" }}>WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span></a>
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Check another domain..." spellCheck={false} style={{ background: S.s1, border: `1px solid ${S.e1}`, borderRadius: 8, padding: "6px 12px", fontFamily: S.sans, fontSize: 12.5, fontWeight: 500, color: S.t1, outline: "none", width: 200 }} />
          <button type="submit" style={{ padding: "6px 14px", fontSize: 11.5, fontWeight: 700, color: S.void, background: S.t1, border: "none", borderRadius: 8, cursor: "pointer" }}>Check</button>
        </form>
      </nav>
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "48px 20px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: S.sans, fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, margin: 0 }}>Is {name} Down?</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: S.mono, fontSize: 12, color: S.t3 }}>{domain}</span>
            {category && <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: S.s3, color: S.t4, border: `1px solid ${S.e0}` }}>{category}</span>}
          </div>
        </div>
        <div style={{ borderRadius: 12, padding: 1, background: up === undefined ? S.e1 : up ? S.upE : S.dnE, marginBottom: 20 }}>
          <div style={{ background: S.s1, borderRadius: 11, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color }}>{label}</span>
              {check && <span style={{ fontFamily: S.mono, fontSize: 11, color: S.t4 }}>Checked {timeAgo(check.checked_at)}</span>}
            </div>
            <button onClick={recheck} disabled={checking} style={{ padding: "8px 18px", fontSize: 12, fontWeight: 700, background: S.s3, color: S.t2, border: `1px solid ${S.e1}`, borderRadius: 8, cursor: checking ? "not-allowed" : "pointer", opacity: checking ? 0.5 : 1, fontFamily: S.sans }}>{checking ? "Checking..." : "Re-check now"}</button>
          </div>
        </div>
        {check && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
            {[{ v: String(check.status_code ?? "\u2014"), l: "HTTP Status" }, { v: `${check.latency_ms}`, l: "Response Time", s: "ms" }, { v: new Date(check.checked_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }), l: "Last Check" }].map(({ v, l, s }) => (
              <div key={l} style={{ borderRadius: 12, padding: 1, background: S.e1 }}>
                <div style={{ background: S.s1, borderRadius: 11, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: S.mono, fontSize: 20, fontWeight: 600, color: S.t1 }}>{v}{s && <span style={{ fontSize: 11, color: S.t3 }}>{s}</span>}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 4 }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* ═══ COMMUNITY REPORTS ═══ */}
        <div style={{ borderRadius: 12, padding: 1, background: S.e1, marginBottom: 20 }}>
          <div style={{ background: S.s1, borderRadius: 11, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Community Reports</div>
              {reportSummary && (reportSummary.reports_1h > 0 || reportSummary.working_confirmations > 0) && (
                <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>
                  {reportSummary.reports_1h} issue{reportSummary.reports_1h !== 1 ? "s" : ""} · {reportSummary.working_confirmations} working
                </span>
              )}
            </div>

            {/* Report counts */}
            {reportSummary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  { v: reportSummary.reports_15m, l: "15 min", color: reportSummary.reports_15m > 50 ? S.dn : reportSummary.reports_15m > 10 ? S.warn : S.t1 },
                  { v: reportSummary.reports_1h, l: "1 hour", color: reportSummary.reports_1h > 50 ? S.dn : reportSummary.reports_1h > 10 ? S.warn : S.t1 },
                  { v: reportSummary.reports_24h, l: "24 hours", color: S.t1 },
                  { v: reportSummary.working_confirmations, l: "Working", color: reportSummary.working_confirmations > 0 ? S.up : S.t1 },
                ].map(({ v, l, color: c }) => (
                  <div key={l} style={{ textAlign: "center", padding: "10px 0", borderRadius: 8, background: S.s2 }}>
                    <div style={{ fontFamily: S.mono, fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Report buttons */}
            {reportSent ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: reportSent === "down" ? S.dnBg : S.upBg, border: `1px solid ${reportSent === "down" ? S.dnBd : S.upBd}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={reportSent === "down" ? S.dn : S.up}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: reportSent === "down" ? S.dn : S.up }}>
                  {reportSent === "down" ? "Issue reported — thanks for helping others!" : "Confirmation received — thanks!"}
                </span>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowIssueTypes(true)} style={{
                    flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 700,
                    background: S.dnBg, color: S.dn, border: `1px solid ${S.dnBd}`,
                    borderRadius: 8, cursor: "pointer", fontFamily: S.sans,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Report Issue
                  </button>
                  <button onClick={() => submitReport("working")} style={{
                    flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 700,
                    background: S.upBg, color: S.up, border: `1px solid ${S.upBd}`,
                    borderRadius: 8, cursor: "pointer", fontFamily: S.sans,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    It{"\u2019"}s Working For Me
                  </button>
                </div>
                {showIssueTypes && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", animation: "resIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
                    {[
                      { type: "website", label: "Website Down" },
                      { type: "app", label: "App Issues" },
                      { type: "login", label: "Login Problems" },
                      { type: "api", label: "API Errors" },
                      { type: "connection", label: "Connection Issues" },
                    ].map(({ type, label }) => (
                      <button key={type} onClick={() => submitReport("down", type)} style={{
                        padding: "6px 12px", fontSize: 11, fontWeight: 600,
                        background: S.s2, color: S.t2, border: `1px solid ${S.e1}`,
                        borderRadius: 6, cursor: "pointer", fontFamily: S.sans,
                      }}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 24H OUTAGE REPORT CHART ═══ */}
        <OutageChart24h pulse={pulse} name={name} />

        {/* AI Analysis — loading skeleton */}
        {intelLoading && !intel && (
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 18px", borderBottom: `1px solid ${S.e0}`, fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
              Scanning AI intelligence...
            </div>
            <div style={{ padding: 18 }}>
              {[80, 55, 65].map((w, i) => <div key={i} style={{ height: 8, borderRadius: 3, background: S.s3, marginBottom: 8, width: `${w}%`, animation: `skelP 1s ${i * 0.1}s ease-in-out infinite` }} />)}
            </div>
          </div>
        )}

        {/* AI Analysis — results */}
        {intel && intel.confidence !== undefined && (
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${S.e0}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
                AI Analysis
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: S.t5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Perplexity</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {/* AI Summary */}
              <div style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>AI Summary</div>
              <div style={{ fontSize: 13, color: S.t1, lineHeight: 1.65, fontWeight: 600, marginBottom: 14 }}>{intel.summary}</div>
              {intel.issue_type && <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t3, padding: "2px 7px", background: S.s2, border: `1px solid ${S.e0}`, borderRadius: 4, display: "inline-block", marginBottom: 14 }}>{intel.issue_type}</span>}

              {/* Detected Signals */}
              {intel.signals?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Signals</div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5, padding: 0, margin: 0 }}>
                    {intel.signals.map((s, i) => <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: S.t2, lineHeight: 1.55 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: S.ac, marginTop: 6, flexShrink: 0 }} />{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Confidence */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Confidence</span>
                <ConfidenceBadge confidence={intel.confidence} />
              </div>
            </div>

            {/* Sources */}
            {intel.sources?.length > 0 && (
              <div style={{ borderTop: `1px solid ${S.e0}`, padding: "10px 18px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>Sources</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{intel.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: S.mono, fontSize: 9.5, fontWeight: 500, color: S.ac, textDecoration: "none", padding: "2px 7px", background: S.acG, border: "1px solid rgba(165,180,252,0.08)", borderRadius: 4 }}>{s.title}</a>)}</div>
              </div>
            )}
          </div>
        )}
        {statusPageUrl && (
          <a href={statusPageUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: 12, padding: 1, background: S.e1, textDecoration: "none", marginBottom: 20 }}>
            <div style={{ background: S.s1, borderRadius: 11, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: S.t1 }}>Official Status Page</div><div style={{ fontFamily: S.mono, fontSize: 11, color: S.t4, marginTop: 2 }}>{statusPageUrl}</div></div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={S.t3} strokeWidth="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
            </div>
          </a>
        )}
        {related.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: S.sans, fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: S.t1 }}>Related services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {related.map(r => (
                <a key={r.domain} href={`/status/${r.domain}`} style={{ borderRadius: 12, padding: 1, background: S.e1, textDecoration: "none", color: S.t1 }}>
                  <div style={{ background: S.s1, borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>{r.domain}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: S.sans, fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14, color: S.t1 }}>Frequently asked</h2>
          {[
            { q: `Is ${name} down right now?`, a: check?.reachable ? `Based on our latest check, ${name} (${domain}) is operational with a response time of ${check.latency_ms}ms.` : check ? `Our latest check shows ${name} may be experiencing issues. ${check.error || "The service appears unreachable."}` : `Run a check above to see the status of ${name}.` },
            { q: `How does WebsiteDown check ${name}?`, a: `We perform a server-side HTTP request to ${domain}, measuring response time and status code. Our AI engine also scans the web for outage reports.` },
          ].map(({ q, a }) => (
            <div key={q} style={{ borderRadius: 12, padding: 1, background: S.e1, marginBottom: 8 }}>
              <div style={{ background: S.s1, borderRadius: 11, padding: "16px 18px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.t1, marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 12.5, color: S.t3, lineHeight: 1.6 }}>{a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div style={{ borderTop: `1px solid ${S.e0}`, padding: "24px 0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 12, color: S.t4 }}><strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown.com</strong> \u00b7 Real-time outage detection</div>
          <div style={{ display: "flex", gap: 18 }}>
            {["About","API","Privacy"].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 11, fontWeight: 600, color: S.t4, textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const styles: Record<string, { color: string; bg: string; bd: string; label: string }> = {
    none:   { color: S.t3, bg: S.s3, bd: S.e0, label: "No signals" },
    low:    { color: S.t2, bg: "rgba(148,163,184,0.06)", bd: "rgba(148,163,184,0.1)", label: "Low confidence" },
    medium: { color: S.warn, bg: "rgba(251,191,36,0.06)", bd: "rgba(251,191,36,0.12)", label: "Medium confidence" },
    high:   { color: S.dn, bg: "rgba(248,113,113,0.06)", bd: "rgba(248,113,113,0.12)", label: "High confidence" },
  };
  const c = styles[confidence] || styles.none;
  return (
    <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em", color: c.color, background: c.bg, border: `1px solid ${c.bd}` }}>{c.label}</span>
  );
}

/* ── 24-Hour Outage Report Chart ── */
function OutageChart24h({ pulse, name }: { pulse: PulseData | null; name: string }) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  if (!pulse) return null;

  // Build 24 hourly buckets, filling missing hours with 0
  const now = new Date();
  const buckets: { hour: number; label: string; reports: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600_000);
    const hourKey = h.getUTCHours();
    const label = h.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false });
    // Find matching sparkline data point
    const match = pulse.sparkline_24h?.find(s => {
      const sH = new Date(s.hour).getUTCHours();
      const sD = new Date(s.hour).getUTCDate();
      return sH === hourKey && sD === h.getUTCDate();
    });
    buckets.push({ hour: hourKey, label, reports: match?.reports ?? 0 });
  }

  const values = buckets.map(b => b.reports);
  const max = Math.max(...values, 1);
  const baseline = pulse.baseline_15m ? pulse.baseline_15m * 4 : 0; // baseline_15m * 4 = approx hourly baseline
  const baselinePct = baseline > 0 ? Math.min((baseline / max) * 100, 95) : 0;

  // Spike detection: any bar > 3x baseline or > 20 absolute
  const spikeThreshold = Math.max(baseline * 3, 20);
  const hasData = values.some(v => v > 0);

  const W = 500, H = 120, PAD_T = 8, PAD_B = 20;
  const barW = (W - 4) / 24;
  const chartH = H - PAD_T - PAD_B;

  return (
    <div style={{ borderRadius: 12, padding: 1, background: S.e1, marginBottom: 20 }}>
      <div style={{ background: S.s1, borderRadius: 11, padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Outage Reports</div>
            <span style={{ fontSize: 9, fontWeight: 600, color: S.t5, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>24 hours</span>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: S.ac, opacity: 0.7 }} />
              <span style={{ fontSize: 9, color: S.t4, fontWeight: 500 }}>Reports</span>
            </div>
            {baseline > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 0, borderTop: `1.5px dashed ${S.warn}` }} />
                <span style={{ fontSize: 9, color: S.t4, fontWeight: 500 }}>Baseline</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: S.dn, opacity: 0.7 }} />
              <span style={{ fontSize: 9, color: S.t4, fontWeight: 500 }}>Spike</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        {!hasData ? (
          <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: S.s2, border: `1px solid ${S.e0}` }}>
            <span style={{ fontFamily: S.mono, fontSize: 11, color: S.t5 }}>No outage reports in the last 24 hours</span>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(pct => (
                <line key={pct} x1={0} x2={W} y1={PAD_T + chartH * (1 - pct)} y2={PAD_T + chartH * (1 - pct)} stroke={S.e0} strokeWidth={1} />
              ))}

              {/* Baseline threshold line */}
              {baseline > 0 && baselinePct < 95 && (
                <line
                  x1={0} x2={W}
                  y1={PAD_T + chartH * (1 - baseline / max)} y2={PAD_T + chartH * (1 - baseline / max)}
                  stroke={S.warn} strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
                />
              )}

              {/* Bars */}
              {buckets.map((b, i) => {
                const barH = max > 0 ? (b.reports / max) * chartH : 0;
                const x = 2 + i * barW;
                const y = PAD_T + chartH - barH;
                const isSpike = b.reports >= spikeThreshold;
                const isHov = hovIdx === i;
                const fill = isSpike ? S.dn : S.ac;

                return (
                  <g key={i}>
                    {/* Hover zone (invisible wider rect) */}
                    <rect
                      x={x} y={PAD_T} width={barW} height={chartH + PAD_B}
                      fill="transparent"
                      onMouseEnter={() => setHovIdx(i)}
                      onMouseLeave={() => setHovIdx(null)}
                      style={{ cursor: "pointer" }}
                    />
                    {/* Bar */}
                    <rect
                      x={x + 1} y={y} width={Math.max(barW - 2, 2)} height={Math.max(barH, b.reports > 0 ? 2 : 0)}
                      rx={2} ry={2}
                      fill={fill}
                      opacity={isHov ? 1 : isSpike ? 0.8 : 0.5}
                      style={{ transition: "opacity 0.12s" }}
                    />
                    {/* Spike indicator */}
                    {isSpike && (
                      <circle cx={x + barW / 2} cy={y - 5} r={2} fill={S.dn} />
                    )}
                  </g>
                );
              })}

              {/* X-axis labels (every 6 hours) */}
              {buckets.map((b, i) => (
                i % 6 === 0 ? (
                  <text key={`label-${i}`} x={2 + i * barW + barW / 2} y={H - 3} textAnchor="middle" fill={S.t5} fontSize={8} fontFamily={S.mono}>{b.label}</text>
                ) : null
              ))}
            </svg>

            {/* Tooltip */}
            {hovIdx !== null && (
              <div style={{
                position: "absolute",
                top: 0, left: `${((hovIdx + 0.5) / 24) * 100}%`,
                transform: "translateX(-50%)",
                padding: "5px 10px", borderRadius: 6,
                background: S.s4, border: `1px solid ${S.e2}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                pointerEvents: "none", zIndex: 10, whiteSpace: "nowrap",
              }}>
                <div style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 700, color: S.t1 }}>
                  {buckets[hovIdx].reports} report{buckets[hovIdx].reports !== 1 ? "s" : ""}
                </div>
                <div style={{ fontFamily: S.mono, fontSize: 9, color: S.t4 }}>
                  {buckets[hovIdx].label}:00
                  {buckets[hovIdx].reports >= spikeThreshold && (
                    <span style={{ color: S.dn, marginLeft: 4 }}>SPIKE</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Peak summary */}
        {hasData && (() => {
          const peak = Math.max(...values);
          const peakIdx = values.indexOf(peak);
          const spikeCount = values.filter(v => v >= spikeThreshold).length;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t3 }}>
                Peak: <strong style={{ color: peak >= spikeThreshold ? S.dn : S.t1 }}>{peak}</strong> at {buckets[peakIdx]?.label}:00
              </span>
              {spikeCount > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
                  padding: "2px 7px", borderRadius: 4,
                  color: S.dn, background: S.dnBg, border: `1px solid ${S.dnBd}`,
                }}>
                  {spikeCount} spike{spikeCount !== 1 ? "s" : ""} detected
                </span>
              )}
              {spikeCount === 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
                  padding: "2px 7px", borderRadius: 4,
                  color: S.up, background: S.upBg, border: `1px solid ${S.upBd}`,
                }}>
                  Normal activity
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
