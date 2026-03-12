# WebsiteDown.com

AI-powered outage detection. Check if any website is down — instantly.

## Stack

- **Next.js 16** / React 19 / TypeScript
- **Tailwind CSS v4**
- **Perplexity AI** for web intelligence (optional)
- Deploys to **Netlify** or **Vercel**

## Setup

```bash
npm install
cp .env.example .env.local    # add your Perplexity API key
npm run dev                    # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PERPLEXITY_API_KEY` | No | Enables AI web intelligence. Without it, only direct checks run. |

Get a key at [perplexity.ai/settings/api](https://docs.perplexity.ai)

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /api/check?domain=discord.com` | Server-side HTTP reachability check |
| `GET /api/intelligence?domain=discord.com` | Perplexity-powered outage intelligence |

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add `PERPLEXITY_API_KEY` in Environment Variables

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Framework: Next.js (auto-detected)
4. Add `PERPLEXITY_API_KEY` in Environment Variables

## Structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage (client component)
│   ├── layout.tsx                # Root layout + fonts
│   ├── globals.css               # Tailwind v4 + design tokens
│   └── api/
│       ├── check/route.ts        # Domain reachability API
│       └── intelligence/route.ts # Perplexity AI API
├── lib/
│   ├── check-domain.ts           # HTTP checker + domain validation
│   └── perplexity-intelligence.ts # AI outage detection engine
middleware.ts                      # URL rewrites (/discord-down → /)
```
