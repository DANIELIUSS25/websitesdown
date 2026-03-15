// SEO page definitions for /is-[service]-down routes

export interface SeoPage {
  slug: string;           // URL slug: "is-discord-down"
  domain: string;         // Domain to check: "discord.com"
  name: string;           // Display name: "Discord"
  description: string;    // What the service is
  troubleshooting: string[]; // Service-specific tips
  keywords: string[];     // SEO keywords
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "is-discord-down",
    domain: "discord.com",
    name: "Discord",
    description: "Discord is a communication platform for communities, gamers, and teams with voice, video, and text chat.",
    troubleshooting: [
      "Check your internet connection and try refreshing Discord (Ctrl+R or Cmd+R)",
      "Clear the Discord cache: Settings → Advanced → Clear Cache, then restart",
      "Try the web version at discord.com/app if the desktop app isn't working",
      "Disable VPN or proxy — Discord may block certain IP ranges",
      "Check Discord's official status page at discordstatus.com",
      "Switch DNS to 1.1.1.1 or 8.8.8.8 if you're having connection issues",
      "Reinstall Discord if the app is crashing or stuck on a loading screen",
    ],
    keywords: ["is discord down", "discord down", "discord outage", "discord not working", "discord server status", "discord status"],
  },
  {
    slug: "is-twitter-down",
    domain: "x.com",
    name: "Twitter / X",
    description: "Twitter (now X) is a social media platform for real-time news, conversations, and public discourse.",
    troubleshooting: [
      "Refresh the page or force-close and reopen the X/Twitter app",
      "Clear your browser cache and cookies for x.com",
      "Try logging out and back in — session tokens can expire",
      "Check if the issue is specific to your account (try viewing without logging in)",
      "Switch between the app and web version to isolate the problem",
      "Disable browser extensions that might interfere (ad blockers, script blockers)",
      "Try a different network — some ISPs may throttle or block X traffic",
    ],
    keywords: ["is twitter down", "twitter down", "is x down", "x.com down", "twitter outage", "twitter not working"],
  },
  {
    slug: "is-youtube-down",
    domain: "youtube.com",
    name: "YouTube",
    description: "YouTube is the world's largest video sharing platform, owned by Google, for watching, uploading, and sharing videos.",
    troubleshooting: [
      "Refresh the page and check if videos load — buffering issues aren't always outages",
      "Clear your browser cache or try incognito/private mode",
      "Check if other Google services are affected (Gmail, Drive) — it may be a Google-wide issue",
      "Lower the video quality to 480p or 360p if videos buffer but the site loads",
      "Try the YouTube app on mobile if the web version is slow",
      "Disable hardware acceleration in your browser settings",
      "Flush your DNS cache: run 'ipconfig /flushdns' (Windows) or 'sudo dscacheutil -flushcache' (Mac)",
    ],
    keywords: ["is youtube down", "youtube down", "youtube not working", "youtube outage", "youtube buffering", "youtube status"],
  },
  {
    slug: "is-chatgpt-down",
    domain: "chat.openai.com",
    name: "ChatGPT",
    description: "ChatGPT is an AI chatbot by OpenAI that can answer questions, write content, analyze data, and assist with tasks.",
    troubleshooting: [
      "Refresh the page — ChatGPT sessions can timeout during high demand",
      "Check OpenAI's official status page at status.openai.com",
      "Try again in a few minutes — ChatGPT often has capacity limits during peak hours",
      "Clear your browser cache and cookies for chat.openai.com",
      "Switch browsers — some extensions can interfere with ChatGPT's interface",
      "If you're on the free tier, try during off-peak hours (early morning or late night)",
      "Check if your API key works separately — the API and chat interface can have different availability",
    ],
    keywords: ["is chatgpt down", "chatgpt down", "chatgpt not working", "openai down", "chatgpt outage", "chatgpt status"],
  },
  {
    slug: "is-instagram-down",
    domain: "instagram.com",
    name: "Instagram",
    description: "Instagram is a photo and video sharing social network owned by Meta for sharing stories, reels, and posts.",
    troubleshooting: [
      "Force-close the Instagram app and reopen it",
      "Check if other Meta services are down (Facebook, WhatsApp) — outages often affect all Meta platforms",
      "Clear the Instagram app cache: Settings → Storage → Clear Cache",
      "Try the web version at instagram.com if the app isn't working",
      "Update the Instagram app to the latest version",
      "Log out and back in to refresh your session token",
      "Switch from Wi-Fi to mobile data (or vice versa) to rule out network issues",
    ],
    keywords: ["is instagram down", "instagram down", "instagram not working", "ig down", "instagram outage", "instagram status"],
  },
  {
    slug: "is-reddit-down",
    domain: "reddit.com",
    name: "Reddit",
    description: "Reddit is a social news aggregation and discussion platform organized into community-driven subreddits.",
    troubleshooting: [
      "Try old.reddit.com — it's more stable during outages than the new interface",
      "Clear your browser cache and cookies for reddit.com",
      "Disable Reddit Enhancement Suite (RES) or other Reddit browser extensions",
      "Try the Reddit mobile app if the web version is down",
      "Check if the issue is site-wide or specific to certain subreddits",
      "Switch to a different Reddit client app (Apollo, Relay, etc.) to test",
      "Check r/help or Reddit's Twitter (@redditstatus) for official updates",
    ],
    keywords: ["is reddit down", "reddit down", "reddit not working", "reddit outage", "reddit status", "reddit servers"],
  },
  {
    slug: "is-tiktok-down",
    domain: "tiktok.com",
    name: "TikTok",
    description: "TikTok is a short-form video platform for creating, sharing, and discovering entertaining video content.",
    troubleshooting: [
      "Force-close the TikTok app and reopen it",
      "Check your internet connection — TikTok requires stable bandwidth for video loading",
      "Clear the TikTok app cache: Profile → Settings → Clear Cache",
      "Update TikTok to the latest version from your app store",
      "Try the web version at tiktok.com if the app isn't working",
      "Switch between Wi-Fi and mobile data to test your connection",
      "Restart your phone — this resolves many app-specific issues",
    ],
    keywords: ["is tiktok down", "tiktok down", "tiktok not working", "tiktok outage", "tiktok status", "tiktok not loading"],
  },
  {
    slug: "is-github-down",
    domain: "github.com",
    name: "GitHub",
    description: "GitHub is a code hosting platform for version control, collaboration, and open-source software development used by millions of developers worldwide.",
    troubleshooting: [
      "Check GitHub's official status page at githubstatus.com for incident updates",
      "Try git operations over SSH instead of HTTPS — SSH and HTTPS use different infrastructure",
      "Clear your browser cache and cookies for github.com",
      "If git push/pull is failing, check if the issue is DNS-related by running 'nslookup github.com'",
      "Try accessing GitHub from a different network or use a VPN",
      "Check if GitHub Actions, Pages, or API are affected separately — they can have independent outages",
      "If authentication is failing, regenerate your personal access token or SSH key",
    ],
    keywords: ["is github down", "github down", "github outage", "github not working", "github status", "github server status", "why is github not working"],
  },
  {
    slug: "is-cloudflare-down",
    domain: "cloudflare.com",
    name: "Cloudflare",
    description: "Cloudflare is a web infrastructure and security company providing CDN, DDoS protection, DNS, and edge computing services that powers a significant portion of the internet.",
    troubleshooting: [
      "Check Cloudflare's system status at cloudflarestatus.com for active incidents",
      "If you see a Cloudflare error page (502, 521, 522), the issue is likely with the origin server, not Cloudflare itself",
      "Try accessing the website using a different DNS resolver (1.1.1.1, 8.8.8.8) to isolate DNS issues",
      "Clear your browser cache — Cloudflare edge caches may serve stale content during issues",
      "If you manage a site behind Cloudflare, check your Cloudflare dashboard for error analytics",
      "Try accessing the site from a different geographic location — Cloudflare outages can be regional",
      "Check if other Cloudflare-protected sites are also affected — this indicates a Cloudflare-side issue vs. origin",
    ],
    keywords: ["is cloudflare down", "cloudflare down", "cloudflare outage", "cloudflare not working", "cloudflare status", "cloudflare 502", "why is cloudflare not working"],
  },
  {
    slug: "is-aws-down",
    domain: "aws.amazon.com",
    name: "AWS",
    description: "Amazon Web Services (AWS) is the world's largest cloud computing platform providing compute, storage, database, networking, and hundreds of other infrastructure services.",
    troubleshooting: [
      "Check the AWS Service Health Dashboard at health.aws.amazon.com for region-specific incidents",
      "Identify which specific AWS service is affected (EC2, S3, Lambda, RDS, etc.) — outages are usually service-specific",
      "Check if the issue is regional — AWS operates in multiple regions and availability zones",
      "If your application is down, check CloudWatch metrics and alarms for your specific resources",
      "Try switching to a different AWS region if your architecture supports multi-region failover",
      "Check the AWS Personal Health Dashboard in your AWS Console for account-specific notifications",
      "Review your application logs in CloudWatch Logs — the issue may be application-level rather than AWS infrastructure",
    ],
    keywords: ["is aws down", "aws down", "aws outage", "aws not working", "amazon web services down", "aws status", "aws service health", "why is aws not working"],
  },
];

export const SEO_PAGE_MAP = new Map(SEO_PAGES.map(p => [p.slug, p]));
export function getSeoPage(slug: string): SeoPage | undefined { return SEO_PAGE_MAP.get(slug); }
export function getAllSeoSlugs(): string[] { return SEO_PAGES.map(p => p.slug); }
