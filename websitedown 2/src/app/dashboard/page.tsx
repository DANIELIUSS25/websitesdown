"use client";

import { useState, useEffect, type FormEvent } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

type User = { id: string; email: string; plan: string };
type Monitor = {
  id: string; domain: string; is_active: boolean; last_status: string | null;
  last_checked_at: string | null; created_at: string; uptime_24h: number | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchMonitors();
    const iv = setInterval(fetchMonitors, 30_000);
    return () => clearInterval(iv);
  }, []);

  async function fetchUser() {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (!data.user) { window.location.href = "/auth/login"; return; }
    setUser(data.user);
  }

  async function fetchMonitors() {
    try {
      const res = await fetch("/api/monitors");
      if (res.status === 401) { window.location.href = "/auth/login"; return; }
      const data = await res.json();
      setMonitors(data.monitors || []);
    } finally {
      setLoading(false);
    }
  }

  async function addMonitor(e: FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAdding(true); setError("");
    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setAdding(false); return; }
    setNewDomain("");
    setShowAdd(false);
    setAdding(false);
    fetchMonitors();
  }

  async function toggleMonitor(id: string, active: boolean) {
    await fetch(`/api/monitors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !active }),
    });
    fetchMonitors();
  }

  async function deleteMonitor(id: string) {
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    fetchMonitors();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const planLabel = user?.plan === "pro_plus" ? "Pro+" : user?.plan === "pro" ? "Pro" : "Free";

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5, background: S.acG, border: `1px solid rgba(165,180,252,0.1)`, color: S.ac, textTransform: "uppercase", letterSpacing: "0.04em" }}>{planLabel}</span>
          <a href="/dashboard/settings" style={{ fontSize: 12, fontWeight: 600, color: S.t3, textDecoration: "none" }}>Settings</a>
          <button onClick={logout} style={{ fontSize: 12, fontWeight: 600, color: S.t4, background: "none", border: "none", cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>Monitors</h1>
          <p style={{ fontSize: 13, color: S.t3 }}>{user?.email}</p>
        </div>
        {user?.plan !== "free" ? (
          <button onClick={() => setShowAdd(!showAdd)} style={{
            padding: "10px 18px", background: S.t1, color: S.bg, fontSize: 12, fontWeight: 800,
            border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: "-0.02em",
          }}>
            + Add Monitor
          </button>
        ) : (
          <a href="/pricing" style={{
            padding: "10px 18px", background: `linear-gradient(135deg, ${S.acD}, ${S.ac})`, color: S.bg,
            fontSize: 12, fontWeight: 800, border: "none", borderRadius: 10, textDecoration: "none", letterSpacing: "-0.02em",
          }}>
            Upgrade to Pro
          </a>
        )}
      </div>

      {/* Add monitor form */}
      {showAdd && (
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "18px 20px", marginBottom: 16, animation: "resIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
          {error && <div style={{ padding: "8px 12px", borderRadius: 6, background: S.dnBg, border: `1px solid ${S.dnBd}`, fontSize: 11.5, color: S.dn, marginBottom: 12 }}>{error}</div>}
          <form onSubmit={addMonitor} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)}
              placeholder="example.com" autoFocus
              style={{ flex: 1, padding: "10px 14px", background: S.s2, border: `1px solid ${S.e1}`, borderRadius: 8, color: S.t1, fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "var(--font-jetbrains), var(--mono)" }}
            />
            <button type="submit" disabled={adding} style={{
              padding: "10px 20px", background: S.t1, color: S.bg, fontSize: 12, fontWeight: 700,
              border: "none", borderRadius: 8, cursor: "pointer", opacity: adding ? 0.5 : 1, whiteSpace: "nowrap",
            }}>
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
        </div>
      )}

      {/* Monitor list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: S.t4 }}>Loading...</div>
      ) : monitors.length === 0 ? (
        <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.t3, marginBottom: 8 }}>No monitors yet</div>
          <div style={{ fontSize: 12.5, color: S.t4 }}>
            {user?.plan === "free" ? (
              <>Upgrade to Pro to start monitoring websites. <a href="/pricing" style={{ color: S.ac, textDecoration: "none" }}>View plans</a></>
            ) : (
              <>Click &quot;Add Monitor&quot; to start tracking a website.</>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {monitors.map(m => (
            <MonitorRow key={m.id} monitor={m} onToggle={() => toggleMonitor(m.id, m.is_active)} onDelete={() => deleteMonitor(m.id)} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${S.e0}`, padding: "24px 0", marginTop: 48, fontSize: 11, color: S.t5 }}>
        WebsiteDown.com
      </div>
    </div>
  );
}

function MonitorRow({ monitor: m, onToggle, onDelete }: { monitor: Monitor; onToggle: () => void; onDelete: () => void }) {
  const isUp = m.last_status === "up";
  const isDown = m.last_status === "down";
  const neverChecked = !m.last_status;
  const statusColor = isUp ? S.up : isDown ? S.dn : S.t4;
  const statusLabel = isUp ? "Up" : isDown ? "Down" : "Pending";

  const checkedAgo = m.last_checked_at ? timeAgo(new Date(m.last_checked_at)) : "Never";

  return (
    <a href={`/dashboard/monitors/${m.id}`} style={{ textDecoration: "none", color: S.t1 }}>
      <div style={{
        borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "border-color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = S.e1)}
      >
        {/* Status dot */}
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0, boxShadow: isUp ? `0 0 6px rgba(52,211,153,0.3)` : isDown ? `0 0 6px rgba(248,113,113,0.3)` : "none" }} />

        {/* Domain */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.02em" }}>{m.domain}</div>
          <div style={{ fontSize: 11, color: S.t4, marginTop: 1 }}>Checked {checkedAgo}</div>
        </div>

        {/* Uptime badge */}
        {m.uptime_24h !== null && (
          <div style={{
            fontSize: 12, fontWeight: 700, fontFamily: "var(--font-jetbrains), var(--mono)",
            color: m.uptime_24h >= 99 ? S.up : m.uptime_24h >= 95 ? S.warn : S.dn,
          }}>
            {m.uptime_24h}%
          </div>
        )}

        {/* Status */}
        <div style={{
          fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          padding: "3px 8px", borderRadius: 5,
          color: statusColor,
          background: isUp ? S.upBg : isDown ? S.dnBg : S.s3,
          border: `1px solid ${isUp ? S.upBd : isDown ? S.dnBd : S.e0}`,
        }}>
          {statusLabel}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4 }} onClick={e => e.preventDefault()}>
          <button onClick={onToggle} title={m.is_active ? "Pause" : "Resume"} style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.e0}`, background: S.s2,
            color: m.is_active ? S.t3 : S.t5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
          }}>
            {m.is_active ? "⏸" : "▶"}
          </button>
          <button onClick={onDelete} title="Delete" style={{
            width: 28, height: 28, borderRadius: 6, border: `1px solid ${S.e0}`, background: S.s2,
            color: S.t4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
          }}>
            ✕
          </button>
        </div>
      </div>
    </a>
  );
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
