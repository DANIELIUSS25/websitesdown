import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SERVICES, getServiceByDomain, CATEGORY_LABELS, type TrackedService } from "@/config/services";
import StatusPageClient from "./client";

/* ââ Types ââ */

type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] };

/* ââ Helpers ââ */

const BASE = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://websitedown.com";

function isValidDomain(d: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}

async function fetchCheck(domain: string): Promise<CheckResult | null> {
  try {
    const res = await fetch(`${BASE}/api/check?domain=${encodeURIComponent(domain)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchIntel(domain: string): Promise<IntelResult | null> {
  try {
    const res = await fetch(`${BASE}/api/intelligence?domain=${encodeURIComponent(domain)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ââ Static Params â pre-build top services at deploy ââ */

export async function generateStaticParams() {
  return SERVICES.map(s => ({ domain: s.domain }));
}

/* ââ Dynamic Metadata â SEO title/description per domain ââ */

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const decoded = decodeURIComponent(domain);
  const service = getServiceByDomain(decoded);
  const name = service?.name || decoded;

  return {
    title: `Is ${name} Down? â Live Status & Outage Check | WebsiteDown`,
    description: `Check if ${name} is down right now. Real-time server status, response time, and AI-powered outage detection for ${decoded}.`,
    alternates: {
      canonical: `https://websitedown.com/status/${decoded}`,
    },
    openGraph: {
      title: `Is ${name} Down Right Now?`,
      description: `Live status check for ${decoded} â server reachability, response time, and AI outage intelligence.`,
      url: `https://websitedown.com/status/${decoded}`,
      siteName: "WebsiteDown",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Is ${name} Down? | WebsiteDown`,
      description: `Live status for ${decoded}`,
    },
  };
}

/* ââ Page Component (Server) ââ */

export default async function StatusPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const decoded = decodeURIComponent(domain).toLowerCase();

  if (!isValidDomain(decoded)) {
    notFound();
  }

  const service = getServiceByDomain(decoded);
  const name = service?.name || decoded;
  const category = service ? CATEGORY_LABELS[service.category] : null;

  // Server-side data fetch (cached via ISR)
  const [checkData, intelData] = await Promise.all([
    fetchCheck(decoded),
    fetchIntel(decoded),
  ]);

  // Related services (same category, excluding current)
  const related = service
    ? SERVICES.filter(s => s.category === service.category && s.domain !== decoded).slice(0, 4)
    : SERVICES.slice(0, 4);

  // FAQ structured data for rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${name} down right now?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: checkData?.reachable
            ? `Based on our latest check, ${name} (${decoded}) is operational with a response time of ${checkData.latency_ms}ms.`
            : checkData
              ? `Our latest check indicates ${name} (${decoded}) may be experiencing issues. ${checkData.error || "The service appears unreachable."}`
              : `Check the current status of ${name} at websitedown.com/status/${decoded}`,
        },
      },
      {
        "@type": "Question",
        name: `How do I check if ${name} is down?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Visit websitedown.com/status/${decoded} for a real-time server check plus AI-powered outage intelligence that scans the web for reports of ${name} issues.`,
        },
      },
      {
        "@type": "Question",
        name: `What should I do if ${name} is down?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `If ${name} is down, check this page for updates. The AI intelligence section shows current outage reports from across the web. ${service?.statusPage ? `You can also check the official status page at ${service.statusPage}.` : "You can also try clearing your cache, restarting your router, or using a VPN to rule out local issues."}`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <StatusPageClient
        domain={decoded}
        name={name}
        category={category}
        iconKey={service?.icon || null}
        statusPageUrl={service?.statusPage || null}
        initialCheck={checkData}
        initialIntel={intelData}
        related={related.map(s => ({ domain: s.domain, name: s.name, iconKey: s.icon }))}
      />
    </>
  );
}
