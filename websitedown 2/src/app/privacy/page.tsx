import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — WebsiteDown",
  description: "WebsiteDown privacy policy. How we collect, use, and protect your data.",
  alternates: { canonical: "https://websitedown.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <a href="/" style={{ textDecoration: "none", color: "#eef0f4", fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: "#3d4758", fontWeight: 600 }}>.com</span>
        </a>
      </nav>

      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", padding: "60px 20px 80px", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, color: "#3d4758", marginBottom: 32 }}>Last updated: March 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 14, lineHeight: 1.8, color: "#9ba3b0" }}>
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Information we collect</h2>
            <p>When you use WebsiteDown, we may collect:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              <li><strong style={{ color: "#eef0f4" }}>Account data</strong> — email address and password hash when you sign up.</li>
              <li><strong style={{ color: "#eef0f4" }}>Usage data</strong> — domains you check, monitor configurations, and alert preferences.</li>
              <li><strong style={{ color: "#eef0f4" }}>Report data</strong> — anonymized fingerprints when you submit outage reports (we do not store your IP address).</li>
              <li><strong style={{ color: "#eef0f4" }}>Payment data</strong> — processed securely by Stripe. We never store card details.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>How we use your data</h2>
            <p>We use collected information to provide the service: running checks, sending alerts, processing billing, and improving outage detection accuracy. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Third-party services</h2>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong style={{ color: "#eef0f4" }}>Perplexity AI</strong> — processes domain names for outage intelligence (no user data shared).</li>
              <li><strong style={{ color: "#eef0f4" }}>Stripe</strong> — handles payment processing for Pro subscriptions.</li>
              <li><strong style={{ color: "#eef0f4" }}>Resend</strong> — delivers email alerts to subscribers.</li>
              <li><strong style={{ color: "#eef0f4" }}>Netlify</strong> — hosts the application infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Cookies</h2>
            <p>We use a single HttpOnly authentication cookie to maintain your login session. We do not use tracking cookies or third-party analytics.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Data retention</h2>
            <p>Account data is retained while your account is active. Outage reports and check history are retained for up to 90 days. You can request account deletion by contacting support@websitedown.com.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Contact</h2>
            <p>For privacy-related inquiries, email <a href="mailto:support@websitedown.com" style={{ color: "#a5b4fc", textDecoration: "none" }}>support@websitedown.com</a>.</p>
          </section>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.03)", padding: "28px 0 32px", textAlign: "center", fontSize: 12, color: "#3d4758" }}>
        <strong style={{ color: "#6e7a8e", fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
      </footer>
    </div>
  );
}
