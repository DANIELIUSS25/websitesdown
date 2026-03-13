import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebsiteDown — Is it down right now?",
  description: "Instantly check if any website is down. AI-powered outage detection with real-time web intelligence.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://websitedown.com"),
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
