import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SEO_PAGES, getSeoPage } from "@/config/seo-pages";
import { getServiceByDomain, SERVICES, CATEGORY_LABELS } from "@/config/services";
import SeoStatusClient from "./client";

export const revalidate = 60;

type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] };

const BASE = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://websitedown.com";

async function fetchCheck(domain: string): Promise<CheckResult | null> {
  try {
    const res = await fetch(`${BASE}/api/check?domain=${encodeURIComponent(domain)}`, { next: { revalidate: 60 } });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function fetchIntel(domain: string): Promise<IntelResult | null> {
  try {
    const res = await fetch(`${BASE}/api/intelligence?domain=${encodeURIComponent(domain)}`, { next: { revalidate: 120 } });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export function generateStaticParams() {
  return SEO_PAGES.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) return {};

  const title = `Is ${page.name} Down Right Now? Live Status Check | WebsiteDown`;
  const description = `Check if ${page.name} is down right now. Real-time server status, AI-powered outage detection, user reports, and troubleshooting tips for ${page.domain}.`;

  return {
    title,
    description,
    keywords: page.keywords,
    alternates: { canonical: `https://websitedown.com/${slug}` },
    openGraph: {
      title: `Is ${page.name} Down Right Now? — Live Status Check`,
      description: `Live ${page.name} status check with server probe, AI outage intelligence, and community reports. Find out if ${page.domain} is down.`,
      url: `https://websitedown.com/${slug}`,
      siteName: "WebsiteDown",
      type: "website",
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: `Is ${page.name} Down? — WebsiteDown Live Status Check` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Is ${page.name} Down? | WebsiteDown`,
      description: `Real-time ${page.name} status — server check + AI intelligence`,
      images: ["/og-image.svg"],
    },
  };
}

export default async function SeoStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getSeoPage(slug);
  if (!page) notFound();

  const service = getServiceByDomain(page.domain);
  const category = service ? CATEGORY_LABELS[service.category] : null;

  const [checkData, intelData] = await Promise.all([
    fetchCheck(page.domain),
    fetchIntel(page.domain),
  ]);

  const related = service
    ? SERVICES.filter(s => s.category === service.category && s.domain !== page.domain).slice(0, 4)
    : SERVICES.slice(0, 4);

  // Rich FAQ schema (7 questions)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${page.name} down right now?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: checkData?.reachable
            ? `Based on our latest check at ${new Date(checkData.checked_at).toUTCString()}, ${page.name} (${page.domain}) is operational with a response time of ${checkData.latency_ms}ms and HTTP status ${checkData.status_code}.`
            : checkData
              ? `Our latest check indicates ${page.name} (${page.domain}) may be experiencing issues. ${checkData.error || "The service appears unreachable from our servers."}`
              : `Visit websitedown.com/${slug} for a real-time status check of ${page.name}.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I check if ${page.name} is down?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Visit websitedown.com/${slug} for a real-time server check of ${page.domain}. We perform a direct HTTP probe and also scan the web using AI for outage reports, social media signals, and status page updates.`,
        },
      },
      {
        "@type": "Question",
        name: `What should I do if ${page.name} is down?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `If ${page.name} is down: ${page.troubleshooting[0]}. ${page.troubleshooting[1]}. ${service?.statusPage ? `You can also check the official status page at ${service.statusPage}.` : "Check this page for live updates and AI-detected outage signals."}`,
        },
      },
      {
        "@type": "Question",
        name: `Is it just me or is ${page.name} down for everyone?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `WebsiteDown checks ${page.domain} from our global infrastructure — if our check shows the site is up but you can't access it, the issue is likely on your end (network, DNS, ISP, or device). Try the troubleshooting steps on this page.`,
        },
      },
      {
        "@type": "Question",
        name: `How often does ${page.name} go down?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Most major services like ${page.name} maintain 99.9%+ uptime. Brief outages or degraded performance can occur during maintenance, traffic spikes, or infrastructure issues. Check our uptime history section for recent availability data.`,
        },
      },
      {
        "@type": "Question",
        name: `Where can I report a ${page.name} outage?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can report ${page.name} issues on WebsiteDown — our community reports help other users confirm whether the outage is widespread. Visit the ${page.name} status page and click "Report Issue".`,
        },
      },
      {
        "@type": "Question",
        name: `What is ${page.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: page.description,
        },
      },
    ],
  };

  // WebPage schema
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Is ${page.name} Down Right Now?`,
    description: page.description,
    url: `https://websitedown.com/${slug}`,
    isPartOf: { "@type": "WebSite", name: "WebsiteDown", url: "https://websitedown.com" },
    about: { "@type": "WebApplication", name: page.name, url: `https://${page.domain}` },
  };

  // WebApplication schema for the checked service
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.name,
    url: `https://${page.domain}`,
    applicationCategory: category || "WebApplication",
    operatingSystem: "All",
    ...(service?.statusPage && { featureList: `Status page: ${service.statusPage}` }),
  };

  // Organization schema for WebsiteDown
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WebsiteDown",
    url: "https://websitedown.com",
    logo: "https://websitedown.com/og-image.svg",
    description: "AI-powered website outage detection and real-time status monitoring.",
    sameAs: [],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <SeoStatusClient
        slug={slug}
        domain={page.domain}
        name={page.name}
        description={page.description}
        category={category}
        troubleshooting={page.troubleshooting}
        statusPageUrl={service?.statusPage || null}
        initialCheck={checkData}
        initialIntel={intelData}
        related={related.map(s => ({ domain: s.domain, name: s.name, slug: s.slug }))}
      />
    </>
  );
}
