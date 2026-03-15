import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — WebsiteDown",
  description: "Get in touch with the WebsiteDown team for support, feedback, or partnership inquiries.",
  alternates: { canonical: "https://websitedown.com/contact" },
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <a href="/" style={{ textDecoration: "none", color: "#eef0f4", fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: "#3d4758", fontWeight: 600 }}>.com</span>
        </a>
      </nav>

      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", padding: "60px 20px 80px", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 24 }}>Contact</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 14, lineHeight: 1.8, color: "#9ba3b0" }}>
          <p>
            Have a question, found a bug, or want to suggest a feature? We&apos;d love to hear from you.
          </p>

          <div style={{ background: "#0b0d12", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#eef0f4", marginBottom: 4 }}>Email</div>
              <a href="mailto:support@websitedown.com" style={{ color: "#a5b4fc", textDecoration: "none", fontSize: 13 }}>support@websitedown.com</a>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#eef0f4", marginBottom: 4 }}>Response time</div>
              <div style={{ fontSize: 13 }}>We typically respond within 24 hours.</div>
            </div>
          </div>

          <p>
            For urgent monitoring issues, Pro subscribers can reach us through
            their dashboard for priority support.
          </p>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.03)", padding: "28px 0 32px", textAlign: "center", fontSize: 12, color: "#3d4758" }}>
        <strong style={{ color: "#6e7a8e", fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
      </footer>
    </div>
  );
}
