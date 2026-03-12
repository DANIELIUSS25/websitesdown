import type { MetadataRoute } from "next";
import { SERVICES } from "@/config/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://websitedown.com";

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    // Status pages for all tracked services
    ...SERVICES.map(s => ({
      url: `${base}/status/${s.domain}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}

