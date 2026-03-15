# Security Audit Report — WebsiteDown

**Date:** 2026-03-15
**Auditor:** Automated Security Scan (Claude)
**Scope:** Full codebase — `/websitedown 2/`

---

## Executive Summary

The WebsiteDown project demonstrates solid security fundamentals: parameterized SQL queries, proper password hashing (PBKDF2-SHA256), HttpOnly/Secure cookies, HSTS headers, and rate limiting on public endpoints. No hardcoded secrets were found in source code.

However, **6 findings** require attention — 1 high, 4 medium, 1 low severity.

---

## Findings

### 1. [HIGH] Auth Endpoints Missing Rate Limiting

**Files:**
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/signup/route.ts`

**Description:**
Login and signup endpoints have **no rate limiting**, making them vulnerable to:
- Credential stuffing / brute force attacks on login
- Mass account creation on signup
- Account enumeration (signup returns "Email already registered" on 409)

**Impact:** An attacker can attempt unlimited login attempts or flood registrations.

**Recommended Fix:**
```typescript
// Add at the top of both POST handlers:
const ip = getClientIP(req.headers);
if (!rateLimit(`auth-login:${ip}`, 5, 60_000)) {
  return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
}
```
Also consider returning a generic error for both "email not found" and "wrong password" on signup to prevent enumeration (currently login does this correctly, but signup leaks "Email already registered").

---

### 2. [MEDIUM] Wildcard CORS on All API Routes

**File:** `websitedown 2/next.config.mjs:26`

```javascript
{ key: "Access-Control-Allow-Origin", value: "*" }
```

**Description:**
All `/api/*` routes return `Access-Control-Allow-Origin: *`. While acceptable for public read-only endpoints (`/api/check`, `/api/status`), this also applies to **authenticated endpoints** like:
- `/api/billing/checkout` (creates Stripe sessions)
- `/api/monitors` (user monitor CRUD)
- `/api/alerts/channels` (user alert channels)

Because auth uses HttpOnly cookies with `SameSite=Lax`, the CSRF risk is partially mitigated. However, wildcard CORS combined with cookie auth is a defense-in-depth violation.

**Recommended Fix:**
Split the CORS header into two rules:
```javascript
// Public endpoints — keep wildcard
{ source: "/api/(check|status|reports|pulse|outages|intelligence)(.*)", headers: [
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" }
]},
// Authenticated endpoints — restrict origin
{ source: "/api/(auth|billing|monitors|alerts)(.*)", headers: [
  { key: "Access-Control-Allow-Origin", value: "https://websitedown.com" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Credentials", value: "true" }
]}
```

---

### 3. [MEDIUM] Alert Channel Config Returned in API Response

**File:** `src/app/api/alerts/channels/route.ts:17,55`

**Description:**
The GET and POST handlers return the full `config` column, which contains:
- Discord webhook URLs (act as bearer tokens — anyone with the URL can post to the user's channel)
- Telegram chat IDs
- Email addresses

These values are sent to the client in plaintext JSON responses.

**Recommended Fix:**
Mask sensitive fields before returning:
```typescript
const channels = result.rows.map((ch: any) => ({
  ...ch,
  config: {
    ...ch.config,
    webhook_url: ch.config.webhook_url ? "••••" + ch.config.webhook_url.slice(-8) : undefined,
    chat_id: ch.config.chat_id ? "••••" + String(ch.config.chat_id).slice(-4) : undefined,
  }
}));
```

---

### 4. [MEDIUM] FINGERPRINT_SALT Fallback Weakens Anonymization

**File:** `src/app/api/reports/route.ts:117-124`

**Description:**
When `FINGERPRINT_SALT` is not set, the code falls back to a hardcoded string `"wd-fallback-salt"`. This means:
- The fingerprint hash is predictable
- An attacker who knows the salt can correlate IP+UA to fingerprints
- The `console.warn` fires on every request (noisy logs)

**Recommended Fix:**
Fail closed in production — refuse to accept reports without a salt:
```typescript
const salt = process.env.FINGERPRINT_SALT;
if (!salt && process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
}
```

---

### 5. [MEDIUM] SQL String Interpolation in Monitor Checks

**File:** `src/app/api/monitors/[id]/checks/route.ts`

**Description:**
The route uses string interpolation for SQL `INTERVAL` values:
```sql
WHERE checked_at > NOW() - INTERVAL '${interval}'
```
While the `interval` value comes from a hardcoded `intervalMap` (so it's not directly exploitable), this pattern is fragile and violates the principle of parameterized queries everywhere.

**Recommended Fix:**
Use parameterized interval:
```sql
WHERE checked_at > NOW() - make_interval(hours => $2)
```
With the interval value as a number parameter.

---

### 6. [LOW] Console Logging of Full Error Objects in Auth Routes

**Files:**
- `src/app/api/auth/login/route.ts:38` — `console.error("[auth/login]", err)`
- `src/app/api/auth/signup/route.ts:41` — `console.error("[auth/signup]", err)`

**Description:**
These log the full error object, which in database errors could contain:
- Connection strings
- SQL query text with user data
- Stack traces revealing internal paths

Other routes correctly log only `err.message`.

**Recommended Fix:**
```typescript
console.error("[auth/login]", err.message);
```

---

## Verified Secure Patterns

| Area | Status | Details |
|------|--------|---------|
| **No hardcoded secrets** | PASS | All secrets read from `process.env`, `.env.example` contains only placeholders |
| **`.env` files in `.gitignore`** | PASS | `.env`, `.env.local`, `.env.*.local` are all gitignored |
| **`.next/` build directory** | PASS | Not committed to git, listed in inner `.gitignore` |
| **Password hashing** | PASS | PBKDF2-SHA256, 100k iterations, 32-byte random salt |
| **JWT implementation** | PASS | HMAC-SHA256, 7-day expiry, proper verification |
| **Cookie security** | PASS | `HttpOnly`, `SameSite=Lax`, `Secure` in production |
| **Security headers** | PASS | HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **`poweredByHeader: false`** | PASS | Hides Next.js fingerprint |
| **SQL injection prevention** | PASS | All queries use parameterized `$1, $2, ...` placeholders |
| **Stripe webhook verification** | PASS | HMAC-SHA256 signature + 5-min timestamp tolerance |
| **Cron endpoint auth** | PASS | All cron routes verify `CRON_SECRET` |
| **Input validation** | PASS | Domain validation, email format checks, type whitelists |
| **Rate limiting** | PARTIAL | Applied to `/check`, `/intelligence`, `/reports`, `/newsletter`, but missing on auth routes |
| **NEXT_PUBLIC_ usage** | PASS | Only `NEXT_PUBLIC_SITE_URL` is exposed (non-sensitive, just the site URL) |
| **Netlify config** | PASS | No secrets or env vars in `netlify.toml` |
| **npm audit** | PASS | 0 known vulnerabilities in dependencies |

---

## Summary Table

| # | Finding | Severity | File(s) | Status |
|---|---------|----------|---------|--------|
| 1 | Auth endpoints missing rate limiting | **HIGH** | `auth/login/route.ts`, `auth/signup/route.ts` | Open |
| 2 | Wildcard CORS on authenticated API routes | **MEDIUM** | `next.config.mjs` | Open |
| 3 | Alert channel config leaked in API response | **MEDIUM** | `alerts/channels/route.ts` | Open |
| 4 | FINGERPRINT_SALT hardcoded fallback | **MEDIUM** | `reports/route.ts` | Open |
| 5 | SQL string interpolation in monitor checks | **MEDIUM** | `monitors/[id]/checks/route.ts` | Open |
| 6 | Full error objects logged in auth routes | **LOW** | `auth/login/route.ts`, `auth/signup/route.ts` | Open |

---

**Overall Assessment:** The project has a strong security posture for its stage. The most urgent fix is **#1 (rate limiting on auth endpoints)** — this is a well-known attack vector. Fixes #2 and #3 should follow. Items #4–#6 are hardening measures for production readiness.

---

# Frontend Exposure Audit

**Date:** 2026-03-15
**Scope:** All client-side code (`"use client"` components), shared libs imported by client, and `NEXT_PUBLIC_` env vars.

---

## 1. Client Components Audited (12 files)

| File | Secrets? | `process.env`? | Sensitive imports? |
|------|----------|----------------|--------------------|
| `src/app/page.tsx` | NONE | NONE | design-tokens, constants (safe) |
| `src/app/[slug]/client.tsx` | NONE | NONE | design-tokens, vantlir (safe) |
| `src/app/status/[domain]/client.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/internet-status/client.tsx` | NONE | NONE | design-tokens, constants (safe) |
| `src/app/dashboard/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/dashboard/settings/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/dashboard/monitors/[id]/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/auth/login/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/auth/signup/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/app/pricing/page.tsx` | NONE | NONE | design-tokens (safe) |
| `src/components/vantlir.tsx` | NONE | NONE | — |
| `src/components/VantlirLogo.tsx` | NONE | NONE | — |
| `client.tsx` (root) | NONE | NONE | — |

**Result: PASS — Zero `process.env` references in any client component.**

---

## 2. Hardcoded Secrets Scan

Searched all client files for: API keys, tokens, Stripe keys, database URLs, passwords, secrets, webhook URLs.

| Pattern | Found in client? |
|---------|-----------------|
| `sk_live`, `sk_test`, `pk_live`, `pk_test` | NO |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | NO |
| `PERPLEXITY_API_KEY` | NO |
| `RESEND_API_KEY` | NO |
| `TELEGRAM_BOT_TOKEN` | NO |
| `JWT_SECRET` | NO |
| `DATABASE_URL`, `postgres://`, `mongodb://` | NO |
| `Bearer ` (hardcoded tokens) | NO |
| Hardcoded API keys or long hex/base64 strings | NO |

**Result: PASS — No secrets hardcoded in any client-side code.**

---

## 3. Environment Variables — Client Bundle Exposure

### `NEXT_PUBLIC_` Variables

Only **one** `NEXT_PUBLIC_` variable exists in the entire project:

| Variable | Value | Sensitive? | Used in client? |
|----------|-------|-----------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | `https://websitedown.com` | NO (public URL) | Yes — `layout.tsx` (server), used for metadata |

**Result: PASS — The only `NEXT_PUBLIC_` variable is the public site URL.**

### Server-only Environment Variables (NOT exposed to client)

All of the following use `process.env` exclusively in server-side files (`/api/` routes and `/lib/` modules imported only by routes):

| Variable | Used in | Client accessible? |
|----------|---------|-------------------|
| `DATABASE_URL` / `NETLIFY_DATABASE_URL` | `lib/db.ts` | NO — only API routes |
| `JWT_SECRET` | `lib/auth.ts` | NO — only API routes |
| `STRIPE_SECRET_KEY` | `api/billing/*` | NO |
| `STRIPE_WEBHOOK_SECRET` | `api/billing/webhook` | NO |
| `STRIPE_PRICE_PRO` | `lib/plans.ts` | NO — only imported by API routes |
| `STRIPE_PRICE_PRO_PLUS` | `lib/plans.ts` | NO — only imported by API routes |
| `PERPLEXITY_API_KEY` | `lib/perplexity-intelligence.ts`, `api/pulse/*/summary` | NO |
| `RESEND_API_KEY` | `lib/alerts.ts`, `api/newsletter` | NO |
| `TELEGRAM_BOT_TOKEN` | `lib/alerts.ts` | NO |
| `CRON_SECRET` | `api/cron/*`, `api/migrate` | NO |
| `FINGERPRINT_SALT` | `api/reports` | NO |

**Result: PASS — All sensitive env vars are server-only. None use `NEXT_PUBLIC_` prefix.**

---

## 4. Client-Side API Calls — Are Sensitive Operations Server-Side?

All client components communicate with the backend exclusively through `/api/*` fetch calls. No client component directly accesses databases, third-party APIs, or secret-bearing services.

| Client Operation | API Endpoint | Sensitive work server-side? |
|-----------------|-------------|---------------------------|
| Domain check | `GET /api/check?domain=` | YES — server-side HTTP probe |
| AI intelligence | `GET /api/intelligence?domain=` | YES — Perplexity API key used server-side |
| Submit report | `POST /api/reports` | YES — DB write, fingerprint hashing |
| Login | `POST /api/auth/login` | YES — password verify, JWT sign |
| Signup | `POST /api/auth/signup` | YES — password hash, DB write |
| Stripe checkout | `POST /api/billing/checkout` | YES — Stripe API with secret key |
| Alert channels | `GET/POST /api/alerts/channels` | YES — DB queries |
| Monitor CRUD | `GET/POST/PUT/DELETE /api/monitors/*` | YES — DB queries |
| Newsletter | `POST /api/newsletter` | YES — Resend API |

**Result: PASS — All sensitive operations are handled server-side.**

---

## 5. Findings — Frontend Specific

### Finding F1. [MEDIUM] Discord Webhook URLs Visible in Client State

**File:** `src/app/dashboard/settings/page.tsx:125-126`

```typescript
const cfg = typeof ch.config === "string" ? JSON.parse(ch.config) : ch.config;
const display = ch.type === "email" ? cfg.email : ch.type === "telegram" ? `Chat ${cfg.chat_id}` : "Webhook configured";
```

The full `config` object (including the complete Discord webhook URL) is fetched into client state from `GET /api/alerts/channels`. While the display text shows "Webhook configured" for Discord, the **raw webhook URL is still in the React state** and visible in browser DevTools > Network tab.

This is a frontend surface of the server-side finding #3 (Alert Channel Config Leaked in API Response).

**Severity:** MEDIUM — Discord webhook URLs are bearer tokens. Anyone who intercepts or inspects the response can post to the user's Discord channel.

**Recommended Fix:** Mask on the server side (see Finding #3 in the main audit). The client already handles masked display correctly.

---

### Finding F2. [LOW] Client-Side `console.error` Logs May Aid Debugging Attackers

**Files:**
- `src/app/page.tsx:128-129` — logs API fetch errors
- `src/app/status/[domain]/client.tsx:66-67` — logs recheck/intel errors
- `src/app/internet-status/client.tsx:128` — logs fetch failures

```typescript
console.error("[check] API error:", err);
console.error("[status] Recheck failed:", err);
```

These log error objects to the browser console. While not directly exploitable, they could reveal:
- API response bodies with error details
- Network error information
- Stack traces in development

**Severity:** LOW — standard pattern, but production client code should minimize console output.

**Recommended Fix:** In production, suppress or reduce client-side error logging, or log only error messages, not full objects.

---

## 6. Summary

### Frontend Exposure Audit Results

| Check | Result |
|-------|--------|
| API keys in client code | **PASS** — None found |
| Secret tokens in client code | **PASS** — None found |
| Stripe secret key exposure | **PASS** — Server-only |
| Database URLs in client | **PASS** — Server-only |
| Private endpoints callable from client | **PASS** — All behind `/api/*` |
| `NEXT_PUBLIC_` prefix misuse | **PASS** — Only used for site URL |
| Sensitive operations on server | **PASS** — All sensitive logic server-side |
| `process.env` in client components | **PASS** — Zero references |
| Discord webhook URLs in client state | **MEDIUM** — Full URL in API response |
| Client console.error output | **LOW** — Logs full error objects |

### Files That Could Leak Sensitive Data

| File | Risk | What Could Leak | Via |
|------|------|----------------|-----|
| `src/app/dashboard/settings/page.tsx` | MEDIUM | Discord webhook URLs, Telegram chat IDs | API response stored in React state, visible in DevTools |

All other client files are clean — no secrets, no env vars, no direct API calls to external services.
