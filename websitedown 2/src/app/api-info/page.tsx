import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API — WebsiteDown",
  description: "WebsiteDown API for programmatic website status checks and outage detection. Coming soon.",
  alternates: { canonical: "https://websitedown.com/api-info" },
};

export default function ApiPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <a href="/" style={{ textDecoration: "none", color: "#eef0f4", fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: "#3d4758", fontWeight: 600 }}>.com</span>
        </a>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.05em", marginBottom: 16 }}>
            <span style={{ color: "#a5b4fc" }}>{"/"}api</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            WebsiteDown API coming soon.
          </h1>
          <p style={{ fontSize: 14, color: "#6e7a8e", lineHeight: 1.7, marginBottom: 32 }}>
            Join the waitlist.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "#0b0d12", border: "1px solid rgba(255,255,255,0.055)",
            borderRadius: 10, padding: "12px 20px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e7a8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <a href="mailto:api@websitedown.com" style={{ color: "#a5b4fc", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
              api@websitedown.com
            </a>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.03)", padding: "28px 0 32px", textAlign: "center", fontSize: 12, color: "#3d4758" }}>
        <strong style={{ color: "#6e7a8e", fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
      </footer>
    </div>
  );
}
