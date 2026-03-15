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
