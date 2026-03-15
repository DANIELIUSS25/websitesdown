import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — WebsiteDown",
  description: "WebsiteDown provides real-time website status checks with AI-powered outage detection. Learn about our mission and technology.",
  alternates: { canonical: "https://websitedown.com/about" },
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <a href="/" style={{ textDecoration: "none", color: "#eef0f4", fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: "#3d4758", fontWeight: 600 }}>.com</span>
        </a>
      </nav>

      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", padding: "60px 20px 80px", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 24 }}>About WebsiteDown</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 14, lineHeight: 1.8, color: "#9ba3b0" }}>
          <p>
            WebsiteDown is a real-time website monitoring and outage detection platform.
            We combine direct server probes with AI-powered web intelligence to give you
            an accurate picture of whether a website is truly down — or if it&apos;s just you.
          </p>
          <p>
            Our system performs HTTP checks from global infrastructure and scans social media,
            status pages, and community reports to detect outages as they happen. Results are
            delivered in seconds, not minutes.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#eef0f4", letterSpacing: "-0.03em", marginTop: 12 }}>How it works</h2>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 20 }}>
            <li><strong style={{ color: "#eef0f4" }}>Direct probe</strong> — We send an HTTP request to the target domain and measure response time, status code, and reachability.</li>
            <li><strong style={{ color: "#eef0f4" }}>AI intelligence</strong> — Perplexity&apos;s sonar model scans the live web for outage signals: social reports, status page updates, news articles.</li>
            <li><strong style={{ color: "#eef0f4" }}>Community reports</strong> — Users can report issues they&apos;re experiencing, helping others confirm whether an outage is widespread.</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#eef0f4", letterSpacing: "-0.03em", marginTop: 12 }}>Monitoring</h2>
          <p>
            Free users get manual checks with AI analysis. Pro subscribers can set up
            automated monitoring with alerts via email, Telegram, and Discord when their
            websites go down.
          </p>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.03)", padding: "28px 0 32px", textAlign: "center", fontSize: 12, color: "#3d4758" }}>
        <strong style={{ color: "#6e7a8e", fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection
      </footer>
    </div>
  );
}
