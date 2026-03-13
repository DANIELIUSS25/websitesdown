"use client";

import { useState, useEffect } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] } | null;
type PulseData = { reports_15m: number; reports_1h: number; reports_24h: number; confirmations_1h: number; spike_ratio: number; anomaly: string; sparkline: { hour: string; reports: number }[]; top_issue: string | null };

interface Props {
  slug: string;
  domain: string;
  name: string;
  description: string;
  category: string | null;
  troubleshooting: string[];
  statusPageUrl: string | null;
  initialCheck: CheckResult | null;
  initialIntel: IntelResult;
  related: { domain: string; name: string; slug: string }[];
}

export default function SeoStatusClient({ slug, domain, name, description, category, troubleshooting, statusPageUrl, initialCheck, initialIntel, related }: Props) {
  const [check, setCheck] = useState<CheckResult | null>(initialCheck);
  const [intel, setIntel] = useState<IntelResult>(initialIntel);
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [checking, setChecking] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Fetch live pulse data on mount
  useEffect(() => {
    fetch(`/api/pulse?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setPulse(d); }).catch(() => {});
  }, [domain]);

  async function recheck() {
    setChecking(true);
    const [checkRes, intelRes] = await Promise.all([
      fetch(`/api/check?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/intelligence?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (checkRes) setCheck(checkRes);
    if (intelRes) setIntel(intelRes);
    setChecking(false);
  }

  const isUp = check?.reachable === true;
  const isDown = check?.reachable === false;
  const statusColor = isUp ? S.up : isDown ? S.dn : S.t4;
  const statusLabel = isUp ? "Operational" : isDown ? "Down" : "Unknown";
  const checkedTime = check?.checked_at ? new Date(check.checked_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "—";

  const confMap: Record<string, { color: string; bg: string; bd: string; label: string }> = {
    none: { color: S.t3, bg: S.s3, bd: S.e0, label: "No signals" },
    low: { color: S.t2, bg: "rgba(148,163,184,0.06)", bd: "rgba(148,163,184,0.1)", label: "Low" },
    medium: { color: S.warn, bg: S.warnBg, bd: S.warnBd, label: "Medium" },
    high: { color: S.dn, bg: S.dnBg, bd: S.dnBd, label: "High" },
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", maxWidth: 860, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <a href="/internet-status" style={{ fontSize: 12, fontWeight: 600, color: S.t3, textDecoration: "none", padding: "5px 10px" }}>Internet Status</a>
          <a href="/pricing" style={{ fontSize: 12, fontWeight: 600, color: S.t3, textDecoration: "none", padding: "5px 10px" }}>Pricing</a>
          <a href="/dashboard" style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 6 }}>Dashboard</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "48px 20px 32px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {category && <span style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 8px", background: S.s2, border: `1px solid ${S.e0}`, borderRadius: 4 }}>{category}</span>}
          <span style={{ fontFamily: S.mono, fontSize: 11, color: S.t4 }}>{domain}</span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 12 }}>
          Is {name} Down Right Now?
        </h1>
        <p style={{ fontSize: 14, color: S.t3, maxWidth: 560, lineHeight: 1.7, marginBottom: 24 }}>
          {description} Check live server status, AI-detected outage signals, and community reports below.
        </p>
        <button onClick={recheck} disabled={checking} style={{
          padding: "10px 22px", background: S.t1, color: S.bg, fontSize: 12.5, fontWeight: 800,
          border: "none", borderRadius: 10, cursor: checking ? "not-allowed" : "pointer",
          opacity: checking ? 0.4 : 1, letterSpacing: "-0.02em",
        }}>
          {checking ? "Checking..." : "Check Now"}
        </button>
      </section>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* ═══ 1. LIVE STATUS CHECK ═══ */}
        {check && (
          <div style={{
            borderRadius: 12, overflow: "hidden", animation: "resIn 0.4s cubic-bezier(0.16,1,0.3,1)",
            background: S.s1, border: `1px solid ${S.e2}`, borderLeft: `3px solid ${statusColor}`, marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ position: "relative", width: 9, height: 9, display: "inline-flex" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor }} />
                  <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${statusColor}`, animation: "dotRing 2s ease-out infinite" }} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", color: statusColor }}>{statusLabel}</span>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: S.s3, color: S.t3, border: `1px solid ${S.e0}` }}>Live Check</span>
              </div>
              <span style={{ fontFamily: S.mono, fontSize: 11, color: S.t4 }}>{domain}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${S.e0}` }}>
              {[
                { v: String(check.status_code ?? "—"), l: "HTTP Status" },
                { v: `${check.latency_ms}`, l: "Latency", s: "ms" },
                { v: checkedTime, l: "Checked At" },
              ].map(({ v, l, s }, i) => (
                <div key={l} style={{ padding: "14px 16px", textAlign: "center", position: "relative" }}>
                  {i < 2 && <div style={{ position: "absolute", right: 0, top: 10, bottom: 10, width: 1, background: S.e0 }} />}
                  <div style={{ fontFamily: S.mono, fontSize: 16, fontWeight: 600, color: S.t1 }}>{v}{s && <small style={{ fontSize: 10, color: S.t3 }}>{s}</small>}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
            {check.error && !check.reachable && (
              <div style={{ padding: "8px 20px", borderTop: `1px solid ${S.e0}`, fontFamily: S.mono, fontSize: 11, color: S.dn, textAlign: "center" }}>{check.error}</div>
            )}
          </div>
        )}

        {/* ═══ 2. REPORT SPIKE CHART + 3. OUTAGE REPORT COUNT ═══ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Report chart */}
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Report Activity (24h)</div>
            {pulse?.sparkline && pulse.sparkline.length > 0 ? (
              <SparkChart data={pulse.sparkline.map(s => s.reports)} />
            ) : (
              <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.mono, fontSize: 11, color: S.t5 }}>No report data</div>
            )}
          </div>

          {/* Report counts */}
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Outage Reports</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { v: pulse?.reports_15m ?? 0, l: "15 min" },
                { v: pulse?.reports_1h ?? 0, l: "1 hour" },
                { v: pulse?.reports_24h ?? 0, l: "24 hours" },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: S.mono, fontSize: 20, fontWeight: 700, color: v > 50 ? S.dn : v > 10 ? S.warn : S.t1 }}>{v}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            {pulse && pulse.anomaly !== "none" && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                  padding: "2px 7px", borderRadius: 4,
                  color: pulse.anomaly === "high" ? S.dn : pulse.anomaly === "elevated" ? S.warn : S.t3,
                  background: pulse.anomaly === "high" ? S.dnBg : pulse.anomaly === "elevated" ? S.warnBg : S.s3,
                  border: `1px solid ${pulse.anomaly === "high" ? S.dnBd : pulse.anomaly === "elevated" ? S.warnBd : S.e0}`,
                }}>
                  {pulse.anomaly} anomaly
                </span>
                {pulse.spike_ratio > 1 && <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t3 }}>{pulse.spike_ratio}x baseline</span>}
              </div>
            )}
          </div>
        </div>

        {/* ═══ 4. AI INTELLIGENCE SUMMARY ═══ */}
        {intel && (
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", marginBottom: 16, animation: "resIn 0.4s 0.1s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${S.e0}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
                AI Outage Intelligence
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: S.t5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Perplexity</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {(() => { const c = confMap[intel.confidence] || confMap.none; return <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: c.color, background: c.bg, border: `1px solid ${c.bd}` }}>{c.label}</span>; })()}
                {intel.issue_type && <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t3, padding: "2px 7px", background: S.s2, border: `1px solid ${S.e0}`, borderRadius: 4 }}>{intel.issue_type}</span>}
              </div>
              <div style={{ fontSize: 13, color: S.t2, lineHeight: 1.65, marginBottom: intel.signals?.length ? 10 : 0 }}>{intel.summary}</div>
              {intel.signals?.length > 0 && (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                  {intel.signals.map((s, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: S.t2, lineHeight: 1.5 }}>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: S.ac, marginTop: 7, flexShrink: 0 }} />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {intel.sources?.length > 0 && (
              <div style={{ borderTop: `1px solid ${S.e0}`, padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                {intel.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: S.mono, fontSize: 9.5, fontWeight: 500, color: S.ac, textDecoration: "none", padding: "2px 7px", background: S.acG, border: `1px solid rgba(165,180,252,0.08)`, borderRadius: 4 }}>{s.title}</a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 5. TROUBLESHOOTING TIPS ═══ */}
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 14 }}>
            {name} Not Working? Try These Fixes
          </h2>
          <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, counterReset: "tips" }}>
            {troubleshooting.map((tip, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: S.t2, lineHeight: 1.6 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: S.s2, border: `1px solid ${S.e0}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: S.mono, fontSize: 10, fontWeight: 700, color: S.ac, marginTop: 1,
                }}>{i + 1}</span>
                {tip}
              </li>
            ))}
          </ol>
          {statusPageUrl && (
            <a href={statusPageUrl} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14,
              fontSize: 12, fontWeight: 600, color: S.ac, textDecoration: "none",
              padding: "6px 12px", background: S.acG, borderRadius: 6, border: `1px solid rgba(165,180,252,0.08)`,
            }}>
              Official {name} Status Page
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          )}
        </div>

        {/* ═══ 6. UPTIME HISTORY PLACEHOLDER ═══ */}
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Uptime History</h2>
            <span style={{ fontSize: 9, fontWeight: 700, color: S.t5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Last 30 days</span>
          </div>
          {/* 30-day bar visualization */}
          <div style={{ display: "flex", gap: 2, height: 28, marginBottom: 10 }}>
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} style={{ flex: 1, borderRadius: 2, background: i === 29 && isDown ? S.dn : S.up, opacity: 0.5 + Math.random() * 0.5 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: S.mono, fontSize: 9, color: S.t5 }}>
            <span>30 days ago</span>
            <span>Today</span>
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: S.s2, border: `1px solid ${S.e0}`, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={S.ac}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            <span style={{ fontSize: 12, color: S.t3 }}>
              Detailed uptime history available with <a href="/pricing" style={{ color: S.ac, textDecoration: "none", fontWeight: 600 }}>Pro monitoring</a> — track {name} every 60 seconds.
            </span>
          </div>
        </div>

        {/* ═══ 7. STRUCTURED FAQ ═══ */}
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.e0}` }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          {[
            { q: `Is ${name} down right now?`, a: check?.reachable ? `Based on our latest check, ${name} is operational with a ${check.latency_ms}ms response time.` : check ? `Our check indicates ${name} may be experiencing issues. ${check.error || ""}` : `Click "Check Now" above to run a live status check.` },
            { q: `Is it just me or is ${name} down for everyone?`, a: `We check ${domain} from our global infrastructure. If our check shows it's up but you can't access it, the problem is likely on your end — try clearing your cache, switching networks, or using a VPN.` },
            { q: `How often does ${name} go down?`, a: `Major services like ${name} typically maintain 99.9%+ uptime. Brief outages can occur during maintenance windows or unexpected traffic spikes. Monitor ${name} with WebsiteDown Pro for detailed uptime tracking.` },
            { q: `What should I do if ${name} is down?`, a: troubleshooting.slice(0, 3).join(" ") },
            { q: `Where can I report a ${name} outage?`, a: `You can report issues on this page. Community reports help confirm whether outages are widespread. ${statusPageUrl ? `You can also check the official status page at ${statusPageUrl}.` : ""}` },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: i < 4 ? `1px solid ${S.e0}` : "none" }}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                style={{
                  width: "100%", padding: "14px 20px", background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: S.t1 }}>{item.q}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.t4} strokeWidth="2.5" style={{ flexShrink: 0, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(180deg)" : "none" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {faqOpen === i && (
                <div style={{ padding: "0 20px 14px", fontSize: 12.5, color: S.t3, lineHeight: 1.7, animation: "resIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ═══ RELATED SERVICES ═══ */}
        {related.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>Related Services</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {related.map(r => (
                <a key={r.domain} href={`/status/${r.domain}`} style={{
                  textDecoration: "none", color: S.t1, borderRadius: 10, padding: 1, background: S.e1,
                }}>
                  <div style={{ background: S.s1, borderRadius: 9, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontFamily: S.mono, fontSize: 9.5, color: S.t4, marginTop: 2 }}>{r.domain}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CTA ═══ */}
        <div style={{ borderRadius: 12, padding: 1, background: `linear-gradient(135deg, rgba(165,180,252,0.1), rgba(129,140,248,0.04))`, marginBottom: 16 }}>
          <div style={{ background: S.s1, borderRadius: 11, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Monitor {name} 24/7</h3>
              <p style={{ fontSize: 12, color: S.t3, margin: 0 }}>Get instant alerts when {name} goes down. Check every 60 seconds.</p>
            </div>
            <a href="/pricing" style={{ padding: "9px 20px", fontSize: 12, fontWeight: 700, color: S.bg, background: S.t1, borderRadius: 8, textDecoration: "none" }}>Start Monitoring</a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${S.e0}`, padding: "24px 0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 12, color: S.t4 }}>
            <strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["About", "API", "Privacy"].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 11, fontWeight: 600, color: S.t4, textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Spark chart (larger version for report activity) ── */
function SparkChart({ data }: { data: number[] }) {
  if (!data.length || data.every(v => v === 0)) {
    return <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: tokens.mono, fontSize: 11, color: tokens.t5 }}>No reports</div>;
  }
  const w = 300, h = 48;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  const peakVal = Math.max(...data);
  const peakIdx = data.indexOf(peakVal);
  const peakX = peakIdx * step;
  const peakY = h - 2 - (peakVal / max) * (h - 4);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={area} fill={S.ac} opacity={0.08} />
      <path d={line} fill="none" stroke={S.ac} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {peakVal > 0 && <circle cx={peakX} cy={peakY} r={2.5} fill={S.ac} />}
    </svg>
  );
}
