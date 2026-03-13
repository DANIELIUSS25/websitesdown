"use client";
import { useState, useEffect, useRef } from "react";
import { tokens } from "@/lib/design-tokens";
import { DASHBOARD_REFRESH_MS } from "@/lib/constants";

const S = { ...tokens, void: tokens.bg };

type ServiceStatus = {
  domain: string; name: string; category: string | null;
  reachable: boolean | null; latency_ms: number | null;
  status_code: number | null; status: string;
};
type PulseEntry = {
  domain: string; reports_15m: number; reports_1h: number; reports_24h: number;
  confirmations_1h: number; baseline_15m: number; spike_ratio: number;
  anomaly: string; sparkline: number[];
};
type DashData = {
  services: ServiceStatus[];
  outages: (ServiceStatus & { reports_1h: number; anomaly: string })[];
  trending: PulseEntry[];
  pulse: PulseEntry[];
  stats: { total_services: number; operational: number; degraded: number; down: number; unknown: number };
  generated_at: string;
};

const CATEGORY_ORDER = ["Communication", "Social Media", "Streaming", "AI", "Cloud", "Productivity", "Gaming", "Developer"];

const SERVICE_NAMES: Record<string, string> = {
  "discord.com":"Discord","x.com":"Twitter / X","instagram.com":"Instagram","youtube.com":"YouTube",
  "tiktok.com":"TikTok","reddit.com":"Reddit","chat.openai.com":"ChatGPT","twitch.tv":"Twitch",
  "netflix.com":"Netflix","spotify.com":"Spotify","github.com":"GitHub","aws.amazon.com":"AWS",
  "store.steampowered.com":"Steam","roblox.com":"Roblox","gmail.com":"Gmail","whatsapp.com":"WhatsApp",
  "slack.com":"Slack","zoom.us":"Zoom","claude.ai":"Claude","snapchat.com":"Snapchat",
  "cloud.google.com":"Google Cloud","azure.microsoft.com":"Azure","vercel.com":"Vercel",
  "netlify.com":"Netlify","notion.so":"Notion","figma.com":"Figma","facebook.com":"Facebook",
  "shopify.com":"Shopify","outlook.com":"Outlook","gemini.google.com":"Gemini",
};

function getName(d: string) { return SERVICE_NAMES[d] || d; }
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return "just now"; if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`; return `${Math.floor(s / 3600)}h ago`;
}

/* ── Mini sparkline ── */
function Spark({ data, color, w = 64, h = 20 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data.length || data.every(v => v === 0)) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 1 - (v / max) * (h - 2)).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={area} fill={color} opacity={0.1} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Anomaly badge ── */
function Badge({ level, compact }: { level: string; compact?: boolean }) {
  const cfg: Record<string, { color: string; bg: string; bd: string; label: string }> = {
    major: { color: S.dn, bg: S.dnBg, bd: S.dnBd, label: "Major" },
    elevated: { color: S.warn, bg: S.warnBg, bd: S.warnBd, label: "Elevated" },
    normal: { color: S.up, bg: S.upBg, bd: S.upBd, label: "Normal" },
  };
  const c = cfg[level] || cfg.normal;
  return (
    <span style={{
      fontSize: compact ? 8 : 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      color: c.color, background: c.bg, border: `1px solid ${c.bd}`,
      padding: compact ? "1px 5px" : "2px 7px", borderRadius: 4,
    }}>{c.label}</span>
  );
}

/* ── Status dot ── */
function StatusDot({ status, size = 7 }: { status: string; size?: number }) {
  const colors: Record<string, string> = { operational: S.up, degraded: S.warn, down: S.dn, unknown: S.t4 };
  const c = colors[status] || S.t4;
  return (
    <span style={{ position: "relative", width: size, height: size, display: "inline-flex", flexShrink: 0 }}>
      <span style={{ width: size, height: size, borderRadius: "50%", background: c, display: "block" }} />
      {status === "down" && <span style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `1px solid ${c}`, animation: "dotRing 2s ease-out infinite", opacity: 0 }} />}
    </span>
  );
}

/* ── Section header ── */
function SectionHead({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: S.s2, border: `1px solid ${S.e0}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</span>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>{title}</h2>
          {sub && <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>{sub}</span>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ================================================================ */
export default function InternetStatusClient() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, DASHBOARD_REFRESH_MS);
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); clearInterval(t); };
  }, []);

  async function fetchData() {
    try {
      const r = await fetch("/api/status");
      if (r.ok) { setData(await r.json()); setLastRefresh(new Date()); }
    } catch (err) {
      console.error("[internet-status] Fetch failed:", err);
    }
    setLoading(false);
  }

  const stats = data?.stats || { total_services: 0, operational: 0, degraded: 0, down: 0, unknown: 0 };
  const allClear = stats.down === 0 && stats.degraded === 0;
  const uptimePct = stats.total_services > 0 ? ((stats.operational / stats.total_services) * 100).toFixed(1) : "—";
  const avgLatency = data?.services?.length
    ? Math.round(data.services.filter(s => s.latency_ms).reduce((a, s) => a + (s.latency_ms || 0), 0) / data.services.filter(s => s.latency_ms).length)
    : 0;
  const totalReports1h = data?.pulse?.reduce((a, p) => a + p.reports_1h, 0) || 0;

  return (
    <div style={{ minHeight: "100vh", background: S.void, color: S.t1, fontFamily: S.sans }}>

      {/* ══ GLOBAL STATUS BANNER ══ */}
      <div style={{
        borderBottom: `1px solid ${S.e0}`, padding: "0 20px",
        background: allClear ? "rgba(52,211,153,0.02)" : "rgba(248,113,113,0.02)",
      }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ position: "relative", width: 6, height: 6, display: "inline-flex" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: allClear ? S.up : S.dn }} />
              <span style={{ position: "absolute", inset: -2, borderRadius: "50%", background: allClear ? S.up : S.dn, animation: "livePulse 2s ease-in-out infinite" }} />
            </span>
            <span style={{ fontFamily: S.mono, fontSize: 10.5, fontWeight: 600, color: allClear ? S.up : S.dn }}>
              {loading ? "Connecting..." : allClear ? "All systems operational" : `${stats.down + stats.degraded} service${stats.down + stats.degraded > 1 ? "s" : ""} affected`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: S.mono, fontSize: 9.5, color: S.t5 }}>
              {lastRefresh ? `Updated ${timeAgo(lastRefresh.toISOString())}` : "—"}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: S.t5 }} />
            <span style={{ fontFamily: S.mono, fontSize: 9.5, color: S.t5 }}>Auto-refresh 30s</span>
          </div>
        </div>
      </div>

      {/* ══ NAV ══ */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", maxWidth: 1120, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 700, color: S.ac, padding: "4px 10px", background: S.acG, borderRadius: 6, border: `1px solid rgba(165,180,252,0.08)` }}>Internet Status</span>
          <a href="/pricing" style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 500, color: S.t3, textDecoration: "none", padding: "4px 10px" }}>Pricing</a>
          <a href="/dashboard" style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 6 }}>Dashboard</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ textAlign: "center", padding: "40px 20px 32px", maxWidth: 700, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", top: "-60%", left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(165,180,252,0.025) 0%, transparent 60%)", pointerEvents: "none" }} />
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, margin: "0 0 10px", position: "relative" }}>
          Internet Status
        </h1>
        <p style={{ fontSize: 14, color: S.t3, fontWeight: 500, margin: 0, position: "relative" }}>
          Real-time infrastructure monitoring across {stats.total_services} services
        </p>
      </section>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* ══════ SYSTEM HEALTH OVERVIEW ══════ */}
        <div style={{
          borderRadius: 14, padding: 1, marginBottom: 24,
          background: allClear
            ? "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(52,211,153,0.03))"
            : "linear-gradient(135deg, rgba(248,113,113,0.1), rgba(248,113,113,0.03))",
        }}>
          <div style={{ background: S.s1, borderRadius: 13, padding: "18px 22px" }}>
            <SectionHead
              icon={allClear ? <svg width="14" height="14" viewBox="0 0 24 24" fill={S.up}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill={S.dn}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>}
              title="System Health Overview"
              sub={lastRefresh ? `Last probe ${timeAgo(lastRefresh.toISOString())}` : undefined}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {[
                { v: String(stats.total_services), l: "Tracked", c: S.t1 },
                { v: String(stats.operational), l: "Operational", c: S.up },
                { v: String(stats.degraded), l: "Degraded", c: stats.degraded > 0 ? S.warn : S.t4 },
                { v: String(stats.down), l: "Down", c: stats.down > 0 ? S.dn : S.t4 },
                { v: `${uptimePct}%`, l: "Global Uptime", c: allClear ? S.up : S.warn },
                { v: avgLatency ? `${avgLatency}ms` : "—", l: "Avg Latency", c: avgLatency < 500 ? S.up : avgLatency < 1000 ? S.warn : S.dn },
              ].map(({ v, l, c }) => (
                <div key={l} style={{ background: S.s2, borderRadius: 8, padding: "14px 10px", textAlign: "center", border: `1px solid ${S.e0}` }}>
                  <div style={{ fontFamily: S.mono, fontSize: 20, fontWeight: 700, color: c, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════ TWO-COLUMN LAYOUT ══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 24 }}>

          {/* ── Left: Current Outages ── */}
          <div>
            <SectionHead
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={S.dn}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
              title="Current Outages"
              right={data?.outages && data.outages.length > 0 ? (
                <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 700, color: S.dn, background: S.dnBg, border: `1px solid ${S.dnBd}`, padding: "2px 9px", borderRadius: 10 }}>
                  {data.outages.length} active
                </span>
              ) : undefined}
            />

            {(!data?.outages || data.outages.length === 0) ? (
              <div style={{ borderRadius: 12, background: S.upBg, border: `1px solid ${S.upBd}`, padding: "24px", display: "flex", alignItems: "center", gap: 10 }}>
                <StatusDot status="operational" size={8} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.up }}>No active outages</div>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: S.t4, marginTop: 2 }}>All {stats.operational} monitored services responding normally</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.outages.map(svc => (
                  <a key={svc.domain} href={`/status/${svc.domain}`} style={{ textDecoration: "none", color: S.t1, borderRadius: 12, padding: 1, background: "rgba(248,113,113,0.1)" }}>
                    <div style={{ background: S.s1, borderRadius: 11, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                      <StatusDot status="down" size={9} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{getName(svc.domain)}</div>
                        <div style={{ fontFamily: S.mono, fontSize: 10, color: S.t4, marginTop: 1 }}>{svc.domain}</div>
                      </div>
                      <Badge level={svc.anomaly} />
                      {svc.reports_1h > 0 && (
                        <span style={{ fontFamily: S.mono, fontSize: 10, color: S.dn, fontWeight: 600 }}>{svc.reports_1h} rpt/hr</span>
                      )}
                      <span style={{ fontFamily: S.mono, fontSize: 9, fontWeight: 800, color: S.dn, padding: "2px 6px", background: S.dnBg, borderRadius: 3, letterSpacing: "0.04em" }}>DOWN</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={S.t4} strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Live Activity Feed ── */}
          <div>
            <SectionHead
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={S.ac}><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>}
              title="Live Activity"
              sub={totalReports1h > 0 ? `${totalReports1h} reports/hr` : "Quiet"}
            />
            <div style={{ borderRadius: 12, padding: 1, background: S.e1 }}>
              <div style={{ background: S.s1, borderRadius: 11, maxHeight: 310, overflow: "auto" }}>
                {data?.pulse?.filter(p => p.reports_1h > 0).length === 0 && (
                  <div style={{ padding: "32px 16px", textAlign: "center", fontFamily: S.mono, fontSize: 11, color: S.t5 }}>No recent activity</div>
                )}
                {data?.pulse?.filter(p => p.reports_1h > 0).sort((a, b) => b.reports_1h - a.reports_1h).slice(0, 10).map((p, i) => (
                  <a key={p.domain} href={`/status/${p.domain}`} style={{
                    textDecoration: "none", color: S.t1,
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderBottom: `1px solid ${S.e0}`,
                  }}>
                    <StatusDot status={p.anomaly === "major" ? "down" : p.anomaly === "elevated" ? "degraded" : "operational"} size={6} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{getName(p.domain)}</span>
                    </div>
                    <span style={{
                      fontFamily: S.mono, fontSize: 10, fontWeight: 600,
                      color: p.reports_1h > 50 ? S.dn : p.reports_1h > 10 ? S.warn : S.t3,
                    }}>{p.reports_1h}/hr</span>
                    <Badge level={p.anomaly} compact />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════ TRENDING SERVICES ══════ */}
        {data?.trending && data.trending.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <SectionHead
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={S.warn}><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>}
              title="Trending Services"
              sub="Elevated report activity detected"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              {data.trending.slice(0, 6).map(p => {
                const sparkColor = p.anomaly === "major" ? S.dn : p.anomaly === "elevated" ? S.warn : S.ac;
                return (
                  <a key={p.domain} href={`/status/${p.domain}`} style={{
                    textDecoration: "none", color: S.t1,
                    borderRadius: 12, padding: 1,
                    background: p.anomaly === "major" ? "rgba(248,113,113,0.06)" : p.anomaly === "elevated" ? "rgba(251,191,36,0.04)" : S.e1,
                  }}>
                    <div style={{ background: S.s1, borderRadius: 11, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                      <StatusDot status={p.anomaly === "major" ? "down" : p.anomaly === "elevated" ? "degraded" : "operational"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{getName(p.domain)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontFamily: S.mono, fontSize: 9.5, color: S.t4 }}>{p.reports_1h}/hr</span>
                          {p.spike_ratio > 1 && (
                            <span style={{ fontFamily: S.mono, fontSize: 9, color: p.anomaly === "major" ? S.dn : S.warn, fontWeight: 700 }}>{p.spike_ratio}x baseline</span>
                          )}
                        </div>
                      </div>
                      <Badge level={p.anomaly} compact />
                      <Spark data={p.sparkline} color={sparkColor} w={56} h={18} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════ TOP PLATFORMS MONITORED ══════ */}
        <section style={{ marginBottom: 24 }}>
          <SectionHead
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={S.t2}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>}
            title="Top Platforms Monitored"
            right={<span style={{ fontFamily: S.mono, fontSize: 9.5, color: S.up, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ position: "relative", width: 5, height: 5, display: "inline-flex" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: S.up }} /><span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: S.up, animation: "livePulse 2s ease-in-out infinite" }} /></span>
              Live
            </span>}
          />

          {(() => {
            const grouped: Record<string, ServiceStatus[]> = {};
            data?.services?.forEach(s => {
              const cat = s.category || "Other";
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(s);
            });
            const cats = [...new Set([...CATEGORY_ORDER, ...Object.keys(grouped)])].filter(c => grouped[c]?.length);

            return cats.map(cat => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: S.t5, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, padding: "0 2px" }}>{cat}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 5 }}>
                  {grouped[cat]?.map(svc => {
                    const pulse = data?.pulse?.find(p => p.domain === svc.domain);
                    const latencyColor = svc.latency_ms ? (svc.latency_ms < 300 ? S.up : svc.latency_ms < 800 ? S.warn : S.dn) : S.t4;
                    return (
                      <a key={svc.domain} href={`/status/${svc.domain}`} style={{ textDecoration: "none", color: S.t1, borderRadius: 10, padding: 1, background: S.e1 }}>
                        <div style={{ background: S.s1, borderRadius: 9, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusDot status={svc.status} size={6} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getName(svc.domain)}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                              {svc.latency_ms && <span style={{ fontFamily: S.mono, fontSize: 9, color: latencyColor, fontWeight: 600 }}>{svc.latency_ms}ms</span>}
                              {pulse && pulse.reports_1h > 0 && (
                                <span style={{ fontFamily: S.mono, fontSize: 8, color: pulse.anomaly === "major" ? S.dn : pulse.anomaly === "elevated" ? S.warn : S.t4 }}>
                                  {pulse.reports_1h} rpt
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 7.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
                            color: svc.status === "operational" ? S.up : svc.status === "down" ? S.dn : svc.status === "degraded" ? S.warn : S.t5,
                          }}>
                            {svc.status === "operational" ? "UP" : svc.status === "down" ? "DOWN" : svc.status === "degraded" ? "SLOW" : "—"}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </section>

        {/* ══════ LATEST INCIDENT REPORTS ══════ */}
        <section style={{ marginBottom: 24 }}>
          <SectionHead
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill={S.ac}><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-2-7H8v-2h8v2zm0 4H8v-2h8v2z"/></svg>}
            title="Latest Incident Reports"
            sub="Services with reports in the last 24h"
          />

          <div style={{ borderRadius: 12, padding: 1, background: S.e1 }}>
            <div style={{ background: S.s1, borderRadius: 11, overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 80px 70px 70px 64px",
                padding: "8px 16px", borderBottom: `1px solid ${S.e0}`,
                fontFamily: S.mono, fontSize: 8.5, fontWeight: 700, color: S.t5,
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                <span>Service</span>
                <span style={{ textAlign: "right" }}>Reports/hr</span>
                <span style={{ textAlign: "right" }}>24h Total</span>
                <span style={{ textAlign: "right" }}>Status</span>
                <span style={{ textAlign: "right" }}>Trend</span>
              </div>

              {data?.pulse?.filter(p => p.reports_24h > 0).slice(0, 15).map(p => (
                <a key={p.domain} href={`/status/${p.domain}`} style={{
                  textDecoration: "none", color: S.t1,
                  display: "grid", gridTemplateColumns: "1fr 80px 70px 70px 64px",
                  padding: "9px 16px", alignItems: "center",
                  borderBottom: `1px solid ${S.e0}`,
                  transition: "background 0.1s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <StatusDot status={p.anomaly === "major" ? "down" : p.anomaly === "elevated" ? "degraded" : "operational"} size={5} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{getName(p.domain)}</span>
                    <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t5 }}>{p.domain}</span>
                  </div>
                  <span style={{
                    fontFamily: S.mono, fontSize: 11, textAlign: "right", fontWeight: 600,
                    color: p.reports_1h > 50 ? S.dn : p.reports_1h > 10 ? S.warn : S.t2,
                  }}>{p.reports_1h}</span>
                  <span style={{ fontFamily: S.mono, fontSize: 10, textAlign: "right", color: S.t3 }}>{p.reports_24h}</span>
                  <span style={{ textAlign: "right" }}><Badge level={p.anomaly} compact /></span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Spark data={p.sparkline} color={p.anomaly === "major" ? S.dn : p.anomaly === "elevated" ? S.warn : S.ac} w={50} h={16} />
                  </div>
                </a>
              ))}

              {(!data?.pulse || data.pulse.filter(p => p.reports_24h > 0).length === 0) && (
                <div style={{ padding: "28px 16px", textAlign: "center", fontFamily: S.mono, fontSize: 11, color: S.t5 }}>No incident reports in the last 24 hours</div>
              )}
            </div>
          </div>
        </section>

        {/* ══════ CHECK ANY WEBSITE CTA ══════ */}
        <section>
          <div style={{ borderRadius: 14, padding: 1, background: `linear-gradient(135deg, rgba(165,180,252,0.1), rgba(129,140,248,0.04))` }}>
            <div style={{ background: S.s1, borderRadius: 13, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Check any website</h3>
                <p style={{ fontSize: 12, color: S.t3, margin: 0 }}>Server check + AI web intelligence — results in seconds</p>
              </div>
              <a href="/" style={{ padding: "9px 22px", fontSize: 12.5, fontWeight: 700, color: S.void, background: S.t1, borderRadius: 8, textDecoration: "none", letterSpacing: "-0.01em" }}>
                Check Now
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: `1px solid ${S.e0}`, padding: "22px 0 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1120, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 11.5, color: S.t4 }}>
            <strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown</strong> · Internet infrastructure monitoring
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {["About", "API", "Privacy"].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 11, fontWeight: 600, color: S.t4, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
