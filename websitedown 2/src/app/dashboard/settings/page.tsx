"use client";

import { useState, useEffect, type FormEvent } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

type User = { id: string; email: string; plan: string; stripe_customer_id: string | null };
type Channel = { id: string; type: string; config: Record<string, string>; is_active: boolean; created_at: string };

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addType, setAddType] = useState<"email" | "telegram" | "discord" | null>(null);
  const [formValue, setFormValue] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [userRes, chRes] = await Promise.all([
      fetch("/api/auth/me"), fetch("/api/alerts/channels"),
    ]);
    if (userRes.status === 401) { window.location.href = "/auth/login"; return; }
    const userData = await userRes.json();
    setUser(userData.user);
    const chData = await chRes.json();
    setChannels(chData.channels || []);
    setLoading(false);
  }

  async function addChannel(e: FormEvent) {
    e.preventDefault();
    if (!addType || !formValue.trim()) return;
    setAdding(true); setError("");

    const configMap: Record<string, Record<string, string>> = {
      email: { email: formValue.trim() },
      telegram: { chat_id: formValue.trim() },
      discord: { webhook_url: formValue.trim() },
    };

    const res = await fetch("/api/alerts/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: addType, config: configMap[addType] }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setAdding(false); return; }
    setFormValue(""); setAddType(null); setAdding(false);
    fetchAll();
  }

  async function deleteChannel(id: string) {
    await fetch(`/api/alerts/channels/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function handleUpgrade(plan: string) {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.error || "Failed to start checkout");
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: S.t4 }}>Loading...</div>;

  const planLabel = user?.plan === "pro_plus" ? "Pro+" : user?.plan === "pro" ? "Pro" : "Free";
  const channelTypeLabels: Record<string, string> = { email: "Email", telegram: "Telegram", discord: "Discord Webhook" };

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto", padding: "0 20px" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: S.t3, fontSize: 13, fontWeight: 600 }}>← Dashboard</a>
      </nav>

      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", marginTop: 16, marginBottom: 32 }}>Settings</h1>

      {/* Plan */}
      <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.t2 }}>Current Plan</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
            background: S.acG, border: `1px solid rgba(165,180,252,0.1)`, color: S.ac,
            textTransform: "uppercase", letterSpacing: "0.04em",
          }}>{planLabel}</span>
        </div>
        <div style={{ fontSize: 13, color: S.t3, marginBottom: 14 }}>{user?.email}</div>
        {user?.plan === "free" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleUpgrade("pro")} style={{ flex: 1, padding: "10px 0", background: S.t1, color: S.bg, fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer" }}>
              Upgrade to Pro — $1.99/mo
            </button>
            <button onClick={() => handleUpgrade("pro_plus")} style={{ flex: 1, padding: "10px 0", background: `linear-gradient(135deg, ${S.acD}, ${S.ac})`, color: S.bg, fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer" }}>
              Upgrade to Pro+ — $5/mo
            </button>
          </div>
        )}
        {user?.plan === "pro" && (
          <button onClick={() => handleUpgrade("pro_plus")} style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${S.acD}, ${S.ac})`, color: S.bg, fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer" }}>
            Upgrade to Pro+ — $5/mo
          </button>
        )}
      </div>

      {/* Alert Channels */}
      <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: S.t2 }}>Alert Channels</span>
        </div>

        {channels.length === 0 && !addType && (
          <div style={{ fontSize: 12.5, color: S.t4, marginBottom: 14 }}>No alert channels configured</div>
        )}

        {channels.map(ch => {
          const cfg = typeof ch.config === "string" ? JSON.parse(ch.config) : ch.config;
          const display = ch.type === "email" ? cfg.email : ch.type === "telegram" ? `Chat ${cfg.chat_id}` : "Webhook configured";
          return (
            <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${S.e0}` }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 4, background: S.s3, border: `1px solid ${S.e0}`, color: S.t3 }}>
                {channelTypeLabels[ch.type] || ch.type}
              </span>
              <span style={{ flex: 1, fontSize: 12.5, color: S.t2, fontFamily: "var(--font-jetbrains), var(--mono)" }}>{display}</span>
              <button onClick={() => deleteChannel(ch.id)} style={{ fontSize: 11, color: S.t4, background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          );
        })}

        {/* Add form */}
        {addType ? (
          <form onSubmit={addChannel} style={{ marginTop: 12 }}>
            {error && <div style={{ padding: "8px 12px", borderRadius: 6, background: S.dnBg, border: `1px solid ${S.dnBd}`, fontSize: 11, color: S.dn, marginBottom: 8 }}>{error}</div>}
            <div style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
              {addType === "email" ? "Email address" : addType === "telegram" ? "Telegram chat ID" : "Discord webhook URL"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={formValue} onChange={e => setFormValue(e.target.value)} autoFocus required
                placeholder={addType === "email" ? "alerts@yourteam.com" : addType === "telegram" ? "123456789" : "https://discord.com/api/webhooks/..."}
                style={{ flex: 1, padding: "9px 12px", background: S.s2, border: `1px solid ${S.e1}`, borderRadius: 7, color: S.t1, fontSize: 12.5, outline: "none", fontFamily: "var(--font-jetbrains), var(--mono)" }}
              />
              <button type="submit" disabled={adding} style={{ padding: "9px 16px", background: S.t1, color: S.bg, fontSize: 11, fontWeight: 700, border: "none", borderRadius: 7, cursor: "pointer", opacity: adding ? 0.5 : 1 }}>Add</button>
              <button type="button" onClick={() => { setAddType(null); setError(""); }} style={{ padding: "9px 12px", background: S.s2, color: S.t3, fontSize: 11, fontWeight: 600, border: `1px solid ${S.e0}`, borderRadius: 7, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {(["email", "telegram", "discord"] as const).map(t => (
              <button key={t} onClick={() => setAddType(t)} style={{
                padding: "8px 14px", fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: "pointer",
                background: S.s2, border: `1px solid ${S.e0}`, color: S.t3,
              }}>
                + {channelTypeLabels[t]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
