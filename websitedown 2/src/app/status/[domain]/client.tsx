"use client";
import { useState, useEffect, useRef, type FormEvent } from "react";

type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] } | null;
type RelatedService = { domain: string; name: string; iconKey: string };

const S = {
  void:"#060709",s1:"#0b0d12",s2:"#10131a",s3:"#161921",
  e0:"rgba(255,255,255,0.03)",e1:"rgba(255,255,255,0.055)",e2:"rgba(255,255,255,0.09)",
  t1:"#eef0f4",t2:"#9ba3b0",t3:"#6e7a8e",t4:"#3d4758",t5:"#252d3b",
  ac:"#a5b4fc",acG:"rgba(165,180,252,0.06)",
  up:"#34d399",upE:"rgba(52,211,153,0.18)",dn:"#f87171",dnE:"rgba(248,113,113,0.18)",warn:"#fbbf24",
  mono:"var(--font-jetbrains),'JetBrains Mono',ui-monospace,monospace",
  sans:"var(--font-manrope),'Manrope',system-ui,sans-serif",
};

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
  const [query, setQuery] = useState("");
  useEffect(() => { recheck(); }, [domain]);
  async function recheck() {
    setChecking(true);
    try { const r = await fetch(`/api/check?domain=${encodeURIComponent(domain)}`); if (r.ok) setCheck(await r.json()); } catch {}
    setChecking(false);
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
        {intel && intel.confidence !== undefined && (
          <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: `1px solid ${S.e0}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Live Outage Intelligence</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: S.t5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>via Perplexity AI</span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 13, color: S.t2, lineHeight: 1.65 }}>{intel.summary}</div>
              {intel.signals?.length > 0 && <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5, padding: 0, margin: "10px 0 0" }}>{intel.signals.map((s, i) => <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: S.t2, lineHeight: 1.55 }}><span style={{ width: 3, height: 3, borderRadius: "50%", background: S.ac, marginTop: 6, flexShrink: 0 }} />{s}</li>)}</ul>}
            </div>
            {intel.sources?.length > 0 && <div style={{ borderTop: `1px solid ${S.e0}`, padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 5 }}>{intel.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: S.mono, fontSize: 9.5, fontWeight: 500, color: S.ac, textDecoration: "none", padding: "2px 7px", background: S.acG, border: "1px solid rgba(165,180,252,0.08)", borderRadius: 4 }}>{s.title}</a>)}</div>}
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
