import { Metadata } from "next";
import InternetStatusClient from "./client";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Internet Status — Live Outage Dashboard | WebsiteDown",
  description: "Real-time internet status dashboard. Monitor outages across Discord, Twitter, YouTube, ChatGPT, and 25+ major services. Live checks, community reports, and AI-powered intelligence.",
  alternates: { canonical: "https://websitedown.com/internet-status" },
  openGraph: {
    title: "Internet Status — Live Outage Dashboard",
    description: "Real-time monitoring of 25+ major internet services. Live checks every 60 seconds.",
    url: "https://websitedown.com/internet-status",
    siteName: "WebsiteDown",
  },
};

export default function InternetStatusPage() {
  return <InternetStatusClient />;
}
