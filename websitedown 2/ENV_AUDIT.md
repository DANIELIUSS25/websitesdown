# WebsiteDown — Environment Variable Audit

> Generated 2026-03-15

---

## All Environment Variables

| Variable | Purpose | Category | Required | Example Value |
|---|---|---|---|---|
| `DATABASE_URL` | Postgres connection string | Database | **Yes** | `postgres://user:pass@host/dbname` |
| `NETLIFY_DATABASE_URL` | Postgres via Netlify (fallback) | Database | Alt | Auto-set by Netlify |
| `PERPLEXITY_API_KEY` | AI web intelligence for outage analysis | AI Intelligence | No | `pplx-xxxxxxxxxxxx` |
| `JWT_SECRET` | Signs auth tokens for user sessions | Authentication | **Yes** | Random 64-char string |
| `CRON_SECRET` | Protects cron endpoints from public access | Monitoring Checks | **Yes** | Random secret string |
| `STRIPE_SECRET_KEY` | Stripe API for billing/checkout | Subscription Billing | Yes* | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Validates Stripe webhook signatures | Subscription Billing | Yes* | `whsec_xxx` |
| `STRIPE_PRICE_PRO` | Stripe price ID for Pro plan | Subscription Billing | Yes* | `price_xxx` |
| `STRIPE_PRICE_PRO_PLUS` | Stripe price ID for Pro+ plan | Subscription Billing | Yes* | `price_xxx` |
| `RESEND_API_KEY` | Email alerts via Resend | Alerting System | No | `re_xxxxxxxxxxxx` |
| `TELEGRAM_BOT_TOKEN` | Telegram alert notifications | Alerting System | No | `123456:ABC-DEF` |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for meta/links | App Config | No | `https://websitedown.com` |
| `URL` | Netlify-provided deploy URL (fallback) | App Config | No | Auto-set by Netlify |
| `FINGERPRINT_SALT` | Anonymizes report fingerprints | Authentication | No | Random string |
| `NODE_ENV` | Standard Node environment flag | App Config | Auto | `production` |

\* Required if billing features are enabled; app runs without them but checkout/webhooks will fail.

---

## By Category

### Database
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Primary Postgres connection. All queries fail without it. |
| `NETLIFY_DATABASE_URL` | Alt | Used as fallback if `DATABASE_URL` is unset. |

### AI Intelligence
| Variable | Required | Notes |
|---|---|---|
| `PERPLEXITY_API_KEY` | No | Powers the AI outage analysis in `/api/pulse/[domain]/summary`. Feature degrades gracefully without it. |

### Monitoring Checks
| Variable | Required | Notes |
|---|---|---|
| `CRON_SECRET` | **Yes** | Guards `/api/cron/monitor-check`, `/api/cron/baseline`, `/api/cron/snapshot`, `/api/migrate`. Returns 500 if unset. |

### Subscription Billing
| Variable | Required | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes* | Server-side Stripe API calls for checkout and webhook processing. |
| `STRIPE_WEBHOOK_SECRET` | Yes* | Signature validation for incoming Stripe webhooks. |
| `STRIPE_PRICE_PRO` | Yes* | Maps to the Pro plan price in Stripe. |
| `STRIPE_PRICE_PRO_PLUS` | Yes* | Maps to the Pro+ plan price in Stripe. |

### Alerting System
| Variable | Required | Notes |
|---|---|---|
| `RESEND_API_KEY` | No | Email alert delivery. Alerts silently skip if unset. |
| `TELEGRAM_BOT_TOKEN` | No | Telegram alert delivery. Alerts silently skip if unset. |

### Authentication
| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | **Yes** | Signs/verifies all auth tokens. Auth is fully broken without it. |
| `FINGERPRINT_SALT` | No | Salts anonymous report fingerprints. Falls back to unsalted hashing. |

### App Config
| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for metadata and API self-calls. Defaults to `https://websitedown.com`. |
| `URL` | No | Netlify sets this automatically. Used as fallback for site URL. |
| `NODE_ENV` | Auto | Controls secure cookie flag. Set automatically by runtime. |

---

## Production-Critical Variables

These three will break the app if missing:

1. **`DATABASE_URL`** — all data queries fail, entire app is non-functional
2. **`JWT_SECRET`** — authentication completely broken, no user can log in
3. **`CRON_SECRET`** — monitor-check endpoint returns HTTP 500 (`"CRON_SECRET not set"`)

---

## Variables NOT Found in Codebase

The following were checked but do not exist in the source:

| Variable | Status | Notes |
|---|---|---|
| `REDIS_URL` | Not used | No Redis dependency in the project |
| `NEXT_PUBLIC_APP_URL` | Not used | Actual variable is `NEXT_PUBLIC_SITE_URL` |
| `STRIPE_PUBLIC_KEY` | Not used | Checkout uses server-side redirect, no client-side Stripe |
| `MONITOR_CHECK_INTERVAL` | Not used | Check interval is not configurable via env var |

---

## File References

| Variable | Files |
|---|---|
| `DATABASE_URL` | `src/lib/db.ts` |
| `NETLIFY_DATABASE_URL` | `src/lib/db.ts` |
| `PERPLEXITY_API_KEY` | `src/lib/perplexity-intelligence.ts`, `src/app/api/pulse/[domain]/summary/route.ts` |
| `JWT_SECRET` | `src/lib/auth.ts` |
| `CRON_SECRET` | `src/app/api/cron/baseline/route.ts`, `src/app/api/cron/monitor-check/route.ts`, `src/app/api/cron/snapshot/route.ts`, `src/app/api/migrate/route.ts` |
| `STRIPE_SECRET_KEY` | `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/webhook/route.ts` |
| `STRIPE_WEBHOOK_SECRET` | `src/app/api/billing/webhook/route.ts` |
| `STRIPE_PRICE_PRO` | `src/lib/plans.ts` |
| `STRIPE_PRICE_PRO_PLUS` | `src/lib/plans.ts`, `src/app/api/billing/webhook/route.ts` |
| `RESEND_API_KEY` | `src/lib/alerts.ts` |
| `TELEGRAM_BOT_TOKEN` | `src/lib/alerts.ts` |
| `NEXT_PUBLIC_SITE_URL` | `src/app/layout.tsx`, `src/app/api/billing/checkout/route.ts`, `src/app/[slug]/page.tsx`, `src/app/status/[domain]/page.tsx`, `src/app/api/pulse/[domain]/summary/route.ts` |
| `URL` | `src/app/api/outages/route.ts`, `src/app/[slug]/page.tsx`, `src/app/status/[domain]/page.tsx`, `src/app/api/status/route.ts`, `src/app/api/pulse/[domain]/summary/route.ts` |
| `FINGERPRINT_SALT` | `src/app/api/reports/route.ts` |
| `NODE_ENV` | `src/lib/auth.ts` |
