import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECT_MAP: Record<string, string> = {
  // /is-X-down â /status/domain
  "is-discord-down": "discord.com",
  "is-twitter-down": "x.com",
  "is-instagram-down": "instagram.com",
  "is-youtube-down": "youtube.com",
  "is-chatgpt-down": "chat.openai.com",
  "is-tiktok-down": "tiktok.com",
  "is-reddit-down": "reddit.com",
  "is-twitch-down": "twitch.tv",
  "is-github-down": "github.com",
  "is-spotify-down": "spotify.com",
  "is-netflix-down": "netflix.com",
  "is-aws-down": "aws.amazon.com",
  "is-facebook-down": "facebook.com",
  "is-steam-down": "store.steampowered.com",
  "is-roblox-down": "roblox.com",
  "is-gmail-down": "gmail.com",
  "is-whatsapp-down": "whatsapp.com",
  "is-zoom-down": "zoom.us",
  "is-slack-down": "slack.com",
  "is-notion-down": "notion.so",
  "is-shopify-down": "shopify.com",
  "is-snapchat-down": "snapchat.com",
  "is-vercel-down": "vercel.com",
  "is-netlify-down": "netlify.com",
  "is-claude-down": "claude.ai",

  // /X-down â /status/domain
  "discord-down": "discord.com",
  "twitter-down": "x.com",
  "instagram-down": "instagram.com",
  "youtube-down": "youtube.com",
  "chatgpt-down": "chat.openai.com",
  "tiktok-down": "tiktok.com",
  "reddit-down": "reddit.com",
  "twitch-down": "twitch.tv",
  "github-down": "github.com",
  "spotify-down": "spotify.com",
  "netflix-down": "netflix.com",
  "facebook-down": "facebook.com",
  "steam-down": "store.steampowered.com",
  "roblox-down": "roblox.com",
  "gmail-down": "gmail.com",

  // /X-status â /status/domain
  "discord-status": "discord.com",
  "twitter-status": "x.com",
  "instagram-status": "instagram.com",
  "youtube-status": "youtube.com",
  "chatgpt-status": "chat.openai.com",
  "tiktok-status": "tiktok.com",
  "reddit-status": "reddit.com",
  "twitch-status": "twitch.tv",
  "github-status": "github.com",
  "spotify-status": "spotify.com",
  "netflix-status": "netflix.com",
  "aws-status": "aws.amazon.com",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/outages") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pricing") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  // Check redirect map
  const slug = pathname.slice(1).toLowerCase();
  const domain = REDIRECT_MAP[slug];
  if (domain) {
    return NextResponse.redirect(
      new URL(`/status/${domain}`, request.url),
      { status: 301 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|status|outages|auth|dashboard|pricing|about|privacy|contact|docs|favicon.ico|sitemap.xml|robots.txt).*)"],
};
