import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
