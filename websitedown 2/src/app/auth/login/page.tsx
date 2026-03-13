"use client";

import { useState, type FormEvent } from "react";
import { tokens } from "@/lib/design-tokens";

const S = { ...tokens, t2: "#b0b8c7" };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <a href="/" style={{ display: "block", textAlign: "center", textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 48 }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>

        <div style={{ borderRadius: 16, background: S.s1, border: `1px solid ${S.e1}`, padding: "32px 28px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 6 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: S.t3, marginBottom: 28 }}>Access your monitoring dashboard</p>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: S.dnBg, border: `1px solid ${S.dnBd}`, fontSize: 12, color: S.dn, marginBottom: 16 }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "11px 14px", background: S.s2, border: `1px solid ${S.e1}`, borderRadius: 10, color: S.t1, fontSize: 14, fontWeight: 500, outline: "none" }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                style={{ width: "100%", padding: "11px 14px", background: S.s2, border: `1px solid ${S.e1}`, borderRadius: 10, color: S.t1, fontSize: 14, fontWeight: 500, outline: "none" }}
                placeholder="Min. 8 characters"
              />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: "12px 0", background: S.t1, color: S.bg, fontSize: 13, fontWeight: 800,
              border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1, letterSpacing: "-0.02em", marginTop: 4,
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ fontSize: 12.5, color: S.t4, textAlign: "center", marginTop: 20 }}>
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" style={{ color: S.ac, textDecoration: "none", fontWeight: 600 }}>Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
