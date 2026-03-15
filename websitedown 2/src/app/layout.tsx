import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://websitedown.com";

export const metadata: Metadata = {
  title: "WebsiteDown — Is it down right now?",
  description: "Instantly check if any website is down. AI-powered outage detection with real-time web intelligence.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "WebsiteDown — Is it down right now?",
    description: "Instantly check if any website is down. AI-powered outage detection with real-time web intelligence.",
    url: siteUrl,
    siteName: "WebsiteDown",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "WebsiteDown — Real-time website status checks with AI outage detection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WebsiteDown — Is it down right now?",
    description: "Real-time website status checks + AI-powered outage detection. Find out in seconds.",
    images: ["/og-image.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#060709",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
