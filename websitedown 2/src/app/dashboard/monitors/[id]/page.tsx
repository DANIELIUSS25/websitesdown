"use client";

import { useState, useEffect, use } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

type Monitor = { id: string; domain: string; is_active: boolean; last_status: string | null; last_checked_at: string | null; created_at: string };
type Check = { status: string; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type HourlyCheck = { hour: string; total: number; up: number; avg_latency: number };
type Incident = { id: string; started_at: string; resolved_at: string | null; cause: string | null };
type Uptime = { "24h": number | null; "7d": number | null; "30d": number | null };

export default function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [uptime, setUptime] = useState<Uptime>({ "24h": null, "7d": null, "30d": null });
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [hourlyChecks, setHourlyChecks] = useState<HourlyCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, []);
  useEffect(() => { fetchChecks(); }, [range]);

  async function fetchDetail() {
    const res = await fetch(`/api/monitors/${id}`);
    if (res.status === 401) { window.location.href = "/auth/login"; return; }
    if (res.status === 404) { window.location.href = "/dashboard"; return; }
    const data = await res.json();
    setMonitor(data.monitor);
    setChecks(data.checks);
    setIncidents(data.incidents);
    setUptime(data.uptime);
    setLoading(false);
  }

  async function fetchChecks() {
    if (range === "24h") return; // Already loaded from detail
    const res = await fetch(`/api/monitors/${id}/checks?range=${range}`);
    const data = await res.json();
    if (data.aggregated) { setHourlyChecks(data.checks); setChecks([]); }
    else { setChecks(data.checks); setHourlyChecks([]); }
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: S.t4 }}>Loading...</div>;
  if (!monitor) return null;

  const isUp = monitor.last_status === "up";
  const isDown = monitor.last_status === "down";

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: S.t3, fontSize: 13, fontWeight: 600 }}>← Dashboard</a>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 32 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: isUp ? S.up : isDown ? S.dn : S.t4,
          boxShadow: isUp ? `0 0 8px rgba(52,211,153,0.4)` : isDown ? `0 0 8px rgba(248,113,113,0.4)` : "none",
        }} />
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em" }}>{monitor.domain}</h1>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          padding: "3px 8px", borderRadius: 5,
          color: isUp ? S.up : isDown ? S.dn : S.t4,
          background: isUp ? S.upBg : isDown ? S.dnBg : S.s3,
          border: `1px solid ${isUp ? S.upBd : isDown ? S.dnBd : S.e0}`,
        }}>
          {isUp ? "Up" : isDown ? "Down" : "Pending"}
        </span>
      </div>

      {/* Uptime Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {(["24h", "7d", "30d"] as const).map(period => {
          const val = uptime[period];
          const color = val === null ? S.t4 : val >= 99 ? S.up : val >= 95 ? S.warn : S.dn;
          return (
            <div key={period} style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "20px 18px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.03em" }}>
                {val !== null ? `${val}%` : "—"}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
                Uptime {period}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Timeline (visual bar) */}
      <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.t2 }}>Status Timeline</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["24h", "7d", "30d"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: "4px 10px", fontSize: 10, fontWeight: 700, borderRadius: 5, cursor: "pointer",
                background: range === r ? S.acG : "transparent", border: `1px solid ${range === r ? "rgba(165,180,252,0.12)" : "transparent"}`,
                color: range === r ? S.ac : S.t4,
              }}>{r}</button>
            ))}
          </div>
        </div>
        <StatusBar checks={range === "24h" ? checks : []} hourly={range !== "24h" ? hourlyChecks : []} range={range} />
      </div>

      {/* Incident Timeline */}
      <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 24 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: S.t2, display: "block", marginBottom: 14 }}>Incidents</span>
        {incidents.length === 0 ? (
          <div style={{ fontSize: 12.5, color: S.t4, padding: "8px 0" }}>No incidents recorded</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incidents.map(inc => (
              <div key={inc.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${S.e0}` }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                  background: inc.resolved_at ? S.up : S.dn,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: S.t1 }}>
                    {inc.resolved_at ? "Resolved" : "Ongoing"}
                    {inc.cause && <span style={{ color: S.t3, fontWeight: 500 }}> — {inc.cause}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: S.t4, marginTop: 2, fontFamily: "var(--font-jetbrains), var(--mono)" }}>
                    {new Date(inc.started_at).toLocaleString()}
                    {inc.resolved_at && ` → ${new Date(inc.resolved_at).toLocaleString()}`}
                    {inc.resolved_at && (
                      <span style={{ color: S.t3 }}> ({formatDuration(new Date(inc.resolved_at).getTime() - new Date(inc.started_at).getTime())})</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Checks */}
      {range === "24h" && checks.length > 0 && (
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.t2, display: "block", marginBottom: 14 }}>Recent Checks</span>
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.e0}` }}>
                  {["Status", "Code", "Latency", "Time"].map(h => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: S.t4, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 100).map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${S.e0}` }}>
                    <td style={{ padding: "7px 8px" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.status === "up" ? S.up : S.dn, display: "inline-block", marginRight: 6 }} />
                      <span style={{ color: c.status === "up" ? S.up : S.dn, fontWeight: 600 }}>{c.status === "up" ? "Up" : "Down"}</span>
                    </td>
                    <td style={{ padding: "7px 8px", fontFamily: "var(--font-jetbrains), var(--mono)", color: S.t3 }}>{c.status_code || "—"}</td>
                    <td style={{ padding: "7px 8px", fontFamily: "var(--font-jetbrains), var(--mono)", color: S.t3 }}>{c.latency_ms}ms</td>
                    <td style={{ padding: "7px 8px", fontFamily: "var(--font-jetbrains), var(--mono)", color: S.t4 }}>{new Date(c.checked_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBar({ checks, hourly, range }: { checks: Check[]; hourly: HourlyCheck[]; range: string }) {
  // Build bars from data
  let bars: { up: boolean; ratio: number }[] = [];

  if (range === "24h" && checks.length > 0) {
    // Group into 5-min buckets (288 bars for 24h)
    const buckets = new Map<number, { up: number; total: number }>();
    const now = Date.now();
    checks.forEach(c => {
      const ago = now - new Date(c.checked_at).getTime();
      const bucket = Math.floor(ago / (5 * 60 * 1000));
      const b = buckets.get(bucket) || { up: 0, total: 0 };
      b.total++;
      if (c.status === "up") b.up++;
      buckets.set(bucket, b);
    });
    const maxBucket = Math.max(...buckets.keys(), 0);
    for (let i = maxBucket; i >= 0; i--) {
      const b = buckets.get(i);
      bars.push(b ? { up: b.up / b.total > 0.5, ratio: b.up / b.total } : { up: true, ratio: 1 });
    }
  } else if (hourly.length > 0) {
    bars = hourly.reverse().map(h => ({
      up: h.total > 0 ? h.up / h.total > 0.5 : true,
      ratio: h.total > 0 ? h.up / h.total : 1,
    }));
  }

  if (bars.length === 0) {
    return <div style={{ fontSize: 12, color: S.t4, padding: "8px 0" }}>No data yet</div>;
  }

  // Limit to reasonable number of bars
  const maxBars = 90;
  if (bars.length > maxBars) {
    const step = Math.ceil(bars.length / maxBars);
    const sampled: typeof bars = [];
    for (let i = 0; i < bars.length; i += step) {
      sampled.push(bars[i]);
    }
    bars = sampled;
  }

  return (
    <div style={{ display: "flex", gap: 1.5, height: 32, alignItems: "flex-end" }}>
      {bars.map((b, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 2, height: "100%", borderRadius: 2,
          background: b.ratio >= 0.95 ? S.up : b.ratio >= 0.5 ? S.warn : S.dn,
          opacity: 0.7 + b.ratio * 0.3,
        }} />
      ))}
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
