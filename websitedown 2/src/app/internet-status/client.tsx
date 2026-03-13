"use client";
import { useState, useEffect, useRef } from "react";
import { tokens } from "@/lib/design-tokens";
import { DASHBOARD_REFRESH_MS } from "@/lib/constants";

/* ââ Design tokens ââ */
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

/* ââ Mini sparkline ââ */
function Spark({ data, color, w = 60, h = 18 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data.length || data.every(v => v === 0)) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 1 - (v / max) * (h - 2)).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ââ Anomaly badge ââ */
function Badge({ level, compact }: { level: string; compact?: boolean }) {
  const cfg: Record<string, { color: string; bg: string; bd: string; label: string }> = {
    major: { color: S.dn, bg: S.dnBg, bd: S.dnBd, label: "Major" },
    elevated: { color: S.warn, bg: S.warnBg, bd: S.warnBd, label: "Elevated" },
    normal: { color: S.up, bg: S.upBg, bd: S.upBd, label: "Normal" },
  };
  const c = cfg[level] || cfg.normal;
  return (
    <span style={{
      fontSize: compact ? 8 : 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
      color: c.color, background: c.bg, border: `1px solid ${c.bd}`,
      padding: compact ? "1px 5px" : "2px 8px", borderRadius: 4, fontFamily: S.sans,
    }}>{c.label}</span>
  );
}

/* ââ Status dot ââ */
function StatusDot({ status, size = 8 }: { status: string; size?: number }) {
  const colors: Record<string, string> = { operational: S.up, degraded: S.warn, down: S.dn, unknown: S.t4 };
  return <span style={{ width: size, height: size, borderRadius: "50%", background: colors[status] || S.t4, display: "inline-block", flexShrink: 0 }} />;
}

/* ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */
export default function InternetStatusClient() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      console.error("[internet-status] Failed to fetch dashboard data:", err);
    }
    setLoading(false);
  }

  const stats = data?.stats || { total_services: 0, operational: 0, degraded: 0, down: 0, unknown: 0 };
  const allClear = stats.down === 0 && stats.degraded === 0;
  const uptimePct = stats.total_services > 0
    ? ((stats.operational / stats.total_services) * 100).toFixed(1)
    : "â";

  return (
    <div style={{ minHeight: "100vh", background: S.void, color: S.t1, fontFamily: S.sans }}>
      {/* ââ Top bar ââ */}
      <div style={{ borderBottom: `1px solid ${S.e0}`, padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: allClear ? S.up : S.dn, display: "inline-block" }} />
        <span style={{ fontFamily: S.mono, fontSize: 10, fontWeight: 600, color: allClear ? S.up : S.dn }}>
          {loading ? "Loading..." : allClear ? "All systems operational" : `${stats.down + stats.degraded} service${stats.down + stats.degraded > 1 ? "s" : ""} affected`}
        </span>
        <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t5 }}>Â·</span>
        <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t5 }}>
          {lastRefresh ? `Updated ${timeAgo(lastRefresh.toISOString())}` : "â"}
        </span>
        <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t5 }}>Â·</span>
        <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t5 }}>Refreshes every 30s</span>
      </div>

      {/* ââ Nav ââ */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", maxWidth: 1080, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 600, color: S.ac }}>Internet Status</span>
          {["Checks", "API"].map(l => (
            <a key={l} href={`/${l.toLowerCase()}`} style={{ fontFamily: S.mono, fontSize: 11, fontWeight: 500, color: S.t3, textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </nav>

      {/* ââ Hero ââ */}
      <section style={{ textAlign: "center", padding: "48px 20px 40px", maxWidth: 700, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", top: "-60%", left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(165,180,252,0.03) 0%, transparent 60%)", pointerEvents: "none" }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.05, margin: "0 0 12px", position: "relative" }}>
          Internet Status
        </h1>
        <p style={{ fontSize: 14, color: S.t3, fontWeight: 500, margin: 0, position: "relative" }}>
          Real-time health of {stats.total_services} major internet services
        </p>
      </section>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 48px" }}>

        {/* âââ SECTION 1: System Health Overview âââ */}
        <div style={{
          borderRadius: 14, padding: 1, marginBottom: 28,
          background: allClear
            ? "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.04))"
            : "linear-gradient(135deg, rgba(248,113,113,0.12), rgba(248,113,113,0.04))",
        }}>
          <div style={{ background: S.s1, borderRadius: 13, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{allClear ? "â" : "â ï¸"}</span>
                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>System Health Overview</h2>
              </div>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>
                {lastRefresh ? timeAgo(lastRefresh.toISOString()) : "â"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {[
                { v: stats.total_services, l: "Tracked", c: S.t1, icon: "ð¡" },
                { v: stats.operational, l: "Operational", c: S.up, icon: "â" },
                { v: stats.degraded, l: "Degraded", c: S.warn, icon: "â²" },
                { v: stats.down, l: "Down", c: S.dn, icon: "â" },
                { v: `${uptimePct}%`, l: "Global Uptime", c: allClear ? S.up : S.warn, icon: "â" },
              ].map(({ v, l, c, icon }) => (
                <div key={l} style={{
                  background: S.s2, borderRadius: 10, padding: "14px 16px", textAlign: "center",
                  border: `1px solid ${S.e0}`,
                }}>
                  <div style={{ fontFamily: S.mono, fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* âââ SECTION 2: Current Outages âââ */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>ð¥</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Current Outages</h2>
            {data?.outages && data.outages.length > 0 && (
              <span style={{
                fontFamily: S.mono, fontSize: 10, fontWeight: 700, color: S.dn,
                background: S.dnBg, border: `1px solid ${S.dnBd}`,
                padding: "1px 8px", borderRadius: 10,
              }}>{data.outages.length}</span>
            )}
          </div>

          {(!data?.outages || data.outages.length === 0) ? (
            <div style={{
              borderRadius: 12, padding: "20px 24px",
              background: S.upBg, border: `1px solid ${S.upBd}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <StatusDot status="operational" size={8} />
              <span style={{ fontSize: 13, fontWeight: 600, color: S.up }}>No active outages detected</span>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4, marginLeft: "auto" }}>All {stats.operational} services operational</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.outages.map(svc => (
                <a key={svc.domain} href={`/status/${svc.domain}`} style={{
                  textDecoration: "none", color: S.t1,
                  borderRadius: 12, padding: 1, background: S.dnBd,
                }}>
                  <div style={{
                    background: S.s1, borderRadius: 11, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <StatusDot status="down" size={10} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{getName(svc.domain)}</div>
                      <div style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>{svc.domain}</div>
                    </div>
                    <Badge level={svc.anomaly} />
                    {svc.reports_1h > 0 && (
                      <span style={{ fontFamily: S.mono, fontSize: 11, color: S.dn, fontWeight: 600 }}>
                        {svc.reports_1h} report{svc.reports_1h !== 1 ? "s" : ""}/hr
                      </span>
                    )}
                    <span style={{ fontFamily: S.mono, fontSize: 11, color: S.dn, fontWeight: 700 }}>DOWN</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.t4} strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* âââ SECTION 3: Trending Services âââ */}
        {data?.trending && data.trending.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14 }}>ð</span>
              <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Trending Services</h2>
              <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4 }}>Services with elevated user reports</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.trending.map(p => {
                const sparkColor = p.anomaly === "major" ? S.dn : p.anomaly === "elevated" ? S.warn : S.ac;
                return (
                  <a key={p.domain} href={`/status/${p.domain}`} style={{
                    textDecoration: "none", color: S.t1,
                    borderRadius: 12, padding: 1,
                    background: p.anomaly === "major" ? "rgba(248,113,113,0.08)"
                      : p.anomaly === "elevated" ? "rgba(251,191,36,0.06)"
                      : S.e1,
                  }}>
                    <div style={{
                      background: S.s1, borderRadius: 11, padding: "12px 18px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <StatusDot status={p.anomaly === "major" ? "down" : p.anomaly === "elevated" ? "degraded" : "operational"} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{getName(p.domain)}</span>
                        <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t4, marginLeft: 8 }}>{p.domain}</span>
                      </div>
                      <Badge level={p.anomaly} compact />
                      <span style={{ fontFamily: S.mono, fontSize: 10, color: S.t3 }}>
                        {p.reports_1h}/hr
                      </span>
                      {p.spike_ratio > 1 && (
                        <span style={{ fontFamily: S.mono, fontSize: 9, color: p.anomaly === "major" ? S.dn : S.warn, fontWeight: 600 }}>
                          {p.spike_ratio}x
                        </span>
                      )}
                      <Spark data={p.sparkline} color={sparkColor} />
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={S.t4} strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* âââ SECTION 4: All Platforms âââ */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>ð</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>All Platforms</h2>
            <span style={{ fontFamily: S.mono, fontSize: 10, color: S.up, fontWeight: 600 }}>Live</span>
          </div>

          {/* Group by category */}
          {(() => {
            const grouped: Record<string, ServiceStatus[]> = {};
            data?.services?.forEach(s => {
              const cat = s.category || "Other";
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(s);
            });
            const cats = [...new Set([...CATEGORY_ORDER, ...Object.keys(grouped)])].filter(c => grouped[c]?.length);

            return cats.map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, padding: "0 4px" }}>
                  {cat}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
                  {grouped[cat]?.map(svc => {
                    const pulse = data?.pulse?.find(p => p.domain === svc.domain);
                    return (
                      <a key={svc.domain} href={`/status/${svc.domain}`} style={{
                        textDecoration: "none", color: S.t1,
                        borderRadius: 10, padding: 1, background: S.e1,
                      }}>
                        <div style={{
                          background: S.s1, borderRadius: 9, padding: "12px 14px",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                          <StatusDot status={svc.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {getName(svc.domain)}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t4 }}>
                                {svc.latency_ms ? `${svc.latency_ms}ms` : svc.domain}
                              </span>
                              {pulse && pulse.reports_1h > 0 && (
                                <span style={{ fontFamily: S.mono, fontSize: 8, color: pulse.anomaly === "major" ? S.dn : pulse.anomaly === "elevated" ? S.warn : S.t4 }}>
                                  {pulse.reports_1h} reports
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                            color: svc.status === "operational" ? S.up : svc.status === "down" ? S.dn : svc.status === "degraded" ? S.warn : S.t4,
                          }}>
                            {svc.status === "operational" ? "UP" : svc.status === "down" ? "DOWN" : svc.status === "degraded" ? "SLOW" : "â"}
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

        {/* âââ SECTION 5: Latest Incident Reports âââ */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>ð</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Latest Incident Reports</h2>
          </div>

          <div style={{ borderRadius: 12, padding: 1, background: S.e1 }}>
            <div style={{ background: S.s1, borderRadius: 11, overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 100px 80px 80px",
                padding: "10px 18px", borderBottom: `1px solid ${S.e0}`,
                fontFamily: S.mono, fontSize: 9, fontWeight: 700, color: S.t4,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                <span>Service</span>
                <span style={{ textAlign: "right" }}>Reports/hr</span>
                <span style={{ textAlign: "right" }}>Status</span>
                <span style={{ textAlign: "right" }}>Trend</span>
              </div>

              {/* Rows */}
              {data?.pulse?.filter(p => p.reports_24h > 0).slice(0, 12).map(p => (
                <a key={p.domain} href={`/status/${p.domain}`} style={{
                  textDecoration: "none", color: S.t1,
                  display: "grid", gridTemplateColumns: "1fr 100px 80px 80px",
                  padding: "10px 18px", alignItems: "center",
                  borderBottom: `1px solid ${S.e0}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot status={p.anomaly === "major" ? "down" : p.anomaly === "elevated" ? "degraded" : "operational"} size={6} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{getName(p.domain)}</span>
                    <span style={{ fontFamily: S.mono, fontSize: 9, color: S.t4 }}>{p.domain}</span>
                  </div>
                  <span style={{ fontFamily: S.mono, fontSize: 11, color: p.reports_1h > 50 ? S.dn : p.reports_1h > 10 ? S.warn : S.t2, textAlign: "right", fontWeight: 600 }}>
                    {p.reports_1h}
                  </span>
                  <span style={{ textAlign: "right" }}><Badge level={p.anomaly} compact /></span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Spark data={p.sparkline} color={p.anomaly === "major" ? S.dn : p.anomaly === "elevated" ? S.warn : S.ac} w={50} h={16} />
                  </div>
                </a>
              ))}

              {/* Empty state */}
              {(!data?.pulse || data.pulse.filter(p => p.reports_24h > 0).length === 0) && (
                <div style={{ padding: "24px 18px", textAlign: "center", fontFamily: S.mono, fontSize: 11, color: S.t5 }}>
                  No incident reports in the last 24 hours
                </div>
              )}
            </div>
          </div>
        </section>

        {/* âââ SECTION 6: Quick check CTA âââ */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            borderRadius: 14, padding: 1,
            background: `linear-gradient(135deg, ${S.ac}15, ${S.acD}15)`,
          }}>
            <div style={{
              background: S.s1, borderRadius: 13, padding: "28px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 4px" }}>Check any website</h3>
                <p style={{ fontSize: 12, color: S.t3, margin: 0 }}>Real-time server check + AI outage intelligence in seconds</p>
              </div>
              <a href="/" style={{
                padding: "10px 24px", fontSize: 13, fontWeight: 700, color: S.void,
                background: S.t1, borderRadius: 8, textDecoration: "none",
              }}>Check Now â</a>
            </div>
          </div>
        </section>

      </div>

      {/* ââ Footer ââ */}
      <footer style={{ borderTop: `1px solid ${S.e0}`, padding: "24px 0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1080, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 12, color: S.t4 }}>
            <strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown.com</strong> Â· Real-time internet infrastructure monitoring
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["About", "API", "Privacy"].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 11, fontWeight: 600, color: S.t4, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
