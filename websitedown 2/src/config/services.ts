export type ServiceCategory = "social" | "cloud" | "gaming" | "streaming" | "productivity" | "dev" | "communication" | "ai";

export interface TrackedService {
  domain: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  icon: string;
  statusPage?: string;
  keywords: string[];
}

export const SERVICES: TrackedService[] = [
  // Social
  { domain: "discord.com", name: "Discord", slug: "discord", category: "social", icon: "discord", statusPage: "https://discordstatus.com", keywords: ["discord down", "is discord down", "discord outage", "discord status"] },
  { domain: "x.com", name: "Twitter / X", slug: "twitter", category: "social", icon: "twitter", keywords: ["twitter down", "is twitter down", "x down", "x.com down"] },
  { domain: "instagram.com", name: "Instagram", slug: "instagram", category: "social", icon: "instagram", keywords: ["instagram down", "is instagram down", "ig down"] },
  { domain: "reddit.com", name: "Reddit", slug: "reddit", category: "social", icon: "reddit", keywords: ["reddit down", "is reddit down"] },
  { domain: "tiktok.com", name: "TikTok", slug: "tiktok", category: "social", icon: "tiktok", keywords: ["tiktok down", "is tiktok down"] },
  { domain: "facebook.com", name: "Facebook", slug: "facebook", category: "social", icon: "facebook", keywords: ["facebook down", "is facebook down"] },
  { domain: "snapchat.com", name: "Snapchat", slug: "snapchat", category: "social", icon: "snapchat", keywords: ["snapchat down"] },
  // Streaming
  { domain: "youtube.com", name: "YouTube", slug: "youtube", category: "streaming", icon: "youtube", keywords: ["youtube down", "is youtube down", "yt down"] },
  { domain: "twitch.tv", name: "Twitch", slug: "twitch", category: "streaming", icon: "twitch", keywords: ["twitch down", "is twitch down"] },
  { domain: "netflix.com", name: "Netflix", slug: "netflix", category: "streaming", icon: "netflix", keywords: ["netflix down"] },
  { domain: "spotify.com", name: "Spotify", slug: "spotify", category: "streaming", icon: "spotify", keywords: ["spotify down"] },
  // Gaming
  { domain: "store.steampowered.com", name: "Steam", slug: "steam", category: "gaming", icon: "steam", keywords: ["steam down", "is steam down"] },
  { domain: "roblox.com", name: "Roblox", slug: "roblox", category: "gaming", icon: "roblox", keywords: ["roblox down"] },
  { domain: "epicgames.com", name: "Epic Games", slug: "epic-games", category: "gaming", icon: "epic", keywords: ["epic games down", "fortnite down"] },
  // AI
  { domain: "chat.openai.com", name: "ChatGPT", slug: "chatgpt", category: "ai", icon: "chatgpt", statusPage: "https://status.openai.com", keywords: ["chatgpt down", "is chatgpt down", "openai down"] },
  { domain: "claude.ai", name: "Claude", slug: "claude", category: "ai", icon: "claude", keywords: ["claude down", "anthropic down"] },
  // Cloud / Dev
  { domain: "github.com", name: "GitHub", slug: "github", category: "dev", icon: "github", statusPage: "https://www.githubstatus.com", keywords: ["github down", "is github down"] },
  { domain: "aws.amazon.com", name: "AWS", slug: "aws", category: "cloud", icon: "aws", keywords: ["aws down", "aws outage"] },
  { domain: "cloudflare.com", name: "Cloudflare", slug: "cloudflare", category: "cloud", icon: "cloudflare", statusPage: "https://www.cloudflarestatus.com", keywords: ["cloudflare down", "is cloudflare down", "cloudflare outage"] },
  { domain: "vercel.com", name: "Vercel", slug: "vercel", category: "dev", icon: "vercel", keywords: ["vercel down"] },
  { domain: "netlify.com", name: "Netlify", slug: "netlify", category: "dev", icon: "netlify", keywords: ["netlify down"] },
  // Communication
  { domain: "gmail.com", name: "Gmail", slug: "gmail", category: "communication", icon: "gmail", keywords: ["gmail down", "is gmail down"] },
  { domain: "whatsapp.com", name: "WhatsApp", slug: "whatsapp", category: "communication", icon: "whatsapp", keywords: ["whatsapp down"] },
  { domain: "zoom.us", name: "Zoom", slug: "zoom", category: "communication", icon: "zoom", keywords: ["zoom down"] },
  { domain: "slack.com", name: "Slack", slug: "slack", category: "communication", icon: "slack", keywords: ["slack down"] },
  // Productivity
  { domain: "notion.so", name: "Notion", slug: "notion", category: "productivity", icon: "notion", keywords: ["notion down"] },
  { domain: "shopify.com", name: "Shopify", slug: "shopify", category: "productivity", icon: "shopify", keywords: ["shopify down"] },
];
export const SERVICE_MAP = new Map(SERVICES.map(s => [s.domain, s]));
export function getServiceByDomain(domain: string): TrackedService | undefined { return SERVICE_MAP.get(domain); }
export function getServicesByCategory(category: ServiceCategory): TrackedService[] { return SERVICES.filter(s => s.category === category); }
export const CATEGORY_LABELS: Record<ServiceCategory, string> = { social: "Social Media", streaming: "Streaming", gaming: "Gaming", ai: "AI Services", cloud: "Cloud Infrastructure", dev: "Developer Tools", communication: "Communication", productivity: "Productivity" };

