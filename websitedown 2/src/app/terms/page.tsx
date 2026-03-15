import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — WebsiteDown",
  description: "WebsiteDown terms of service. Rules and conditions for using the platform.",
  alternates: { canonical: "https://websitedown.com/terms" },
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <a href="/" style={{ textDecoration: "none", color: "#eef0f4", fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: "#3d4758", fontWeight: 600 }}>.com</span>
        </a>
      </nav>

      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", padding: "60px 20px 80px", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 12, color: "#3d4758", marginBottom: 32 }}>Last updated: March 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 14, lineHeight: 1.8, color: "#9ba3b0" }}>
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Acceptance</h2>
            <p>By using WebsiteDown, you agree to these terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Service description</h2>
            <p>WebsiteDown provides website status checking, outage detection, and uptime monitoring. Free features include manual checks and AI intelligence. Paid plans add automated monitoring and alerting.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              <li>Use the service to conduct denial-of-service attacks or abuse checks against target domains.</li>
              <li>Automate requests beyond reasonable use or circumvent rate limits.</li>
              <li>Submit false outage reports or manipulate community data.</li>
              <li>Reverse-engineer, scrape, or redistribute the service.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Billing</h2>
            <p>Paid subscriptions are billed monthly through Stripe. You can cancel at any time; access continues until the end of the billing period. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Disclaimer</h2>
            <p>WebsiteDown is provided &quot;as is.&quot; We do our best to provide accurate status data but cannot guarantee 100% accuracy. Status checks reflect reachability from our infrastructure and may not match your local experience.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Limitation of liability</h2>
            <p>WebsiteDown is not liable for damages resulting from service outages, inaccurate data, or missed alerts. Our maximum liability is limited to fees paid in the preceding 12 months.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#eef0f4", marginBottom: 8 }}>Changes</h2>
            <p>We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email to registered users.</p>
          </section>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.03)", padding: "28px 0 32px", textAlign: "center", fontSize: 12, color: "#3d4758" }}>
        <strong style={{ color: "#6e7a8e", fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
      </footer>
    </div>
  );
}
