"use client";

import { useState, useEffect } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

const PLANS = [
  {
    id: "free", name: "Free", price: "$0", period: "forever",
    features: ["Manual website checks", "AI-powered intelligence", "Public status pages", "Community reports"],
    cta: "Current plan", disabled: true, highlight: false,
  },
  {
    id: "pro", name: "Pro", price: "$1.99", period: "/month",
    features: ["Monitor up to 5 websites", "Check every 60 seconds", "Email, Telegram, Discord alerts", "30-day uptime history", "Incident timeline", "3 alert channels"],
    cta: "Upgrade to Pro", disabled: false, highlight: true,
  },
  {
    id: "pro_plus", name: "Pro+", price: "$5", period: "/month",
    features: ["Monitor up to 25 websites", "Check every 60 seconds", "Email, Telegram, Discord alerts", "90-day uptime history", "Incident timeline", "10 alert channels", "Priority support"],
    cta: "Upgrade to Pro+", disabled: false, highlight: false,
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<{ plan: string } | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(() => {});
  }, []);

  async function handleUpgrade(planId: string) {
    if (!user) { window.location.href = "/auth/signup"; return; }
    setUpgrading(planId);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpgrading(null);
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", gap: 8 }}>
          {user ? (
            <a href="/dashboard" style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 8 }}>Dashboard</a>
          ) : (
            <a href="/auth/login" style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 8 }}>Sign in</a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 20px 60px" }}>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.05em", marginBottom: 16 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 15, color: S.t3, maxWidth: 420, margin: "0 auto" }}>
          Start free with manual checks. Upgrade for automated monitoring, alerts, and uptime history.
        </p>
      </section>

      {/* Plans */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PLANS.map(plan => {
          const isCurrent = user?.plan === plan.id || (plan.id === "free" && !user);
          const isHighlight = plan.highlight;
          return (
            <div key={plan.id} style={{
              borderRadius: 16, padding: 1, position: "relative",
              background: isHighlight
                ? `linear-gradient(145deg, rgba(165,180,252,0.2), rgba(129,140,248,0.08), rgba(165,180,252,0.15))`
                : S.e1,
            }}>
              {isHighlight && (
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "3px 12px", borderRadius: 99, background: S.ac, color: S.bg,
                }}>
                  Most popular
                </div>
              )}
              <div style={{ background: S.s1, borderRadius: 15, padding: "32px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: S.t4, fontWeight: 500 }}>{plan.period}</span>
                </div>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: S.t2, lineHeight: 1.5 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={S.up} style={{ flexShrink: 0, marginTop: 2 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && !plan.disabled && handleUpgrade(plan.id)}
                  disabled={isCurrent || plan.disabled || upgrading === plan.id}
                  style={{
                    padding: "12px 0", width: "100%", fontSize: 12.5, fontWeight: 800, border: "none", borderRadius: 10,
                    cursor: isCurrent || plan.disabled ? "default" : "pointer",
                    background: isCurrent ? S.s3 : isHighlight ? S.t1 : S.s3,
                    color: isCurrent ? S.t4 : isHighlight ? S.bg : S.t2,
                    opacity: upgrading === plan.id ? 0.5 : 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {isCurrent ? "Current plan" : upgrading === plan.id ? "Redirecting..." : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${S.e0}`, padding: "28px 0 32px" }}>
        <div style={{ textAlign: "center", fontSize: 12, color: S.t4 }}>
          <strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
        </div>
      </div>
    </div>
  );
}
