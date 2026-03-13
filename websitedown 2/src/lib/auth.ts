// src/lib/auth.ts — Authentication helpers (Web Crypto, no external deps)
// PBKDF2 password hashing + HMAC-SHA256 JWT tokens

const ITERATIONS = 100_000;
const SALT_BYTES = 32;
const KEY_BYTES = 32;
const JWT_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

/** Convert Uint8Array to ArrayBuffer for Web Crypto (strict TS compat) */
function toAB(u: Uint8Array): ArrayBuffer { return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer; }

function getSecret(): ArrayBuffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return toAB(new TextEncoder().encode(secret));
}

// --- Password hashing (PBKDF2-SHA256) ---

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await crypto.subtle.importKey("raw", toAB(new TextEncoder().encode(password)), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: toAB(salt), iterations: ITERATIONS, hash: "SHA-256" }, key, KEY_BYTES * 8);
  return `${buf2hex(salt)}:${buf2hex(new Uint8Array(derived))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = hex2buf(saltHex);
  const key = await crypto.subtle.importKey("raw", toAB(new TextEncoder().encode(password)), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: toAB(salt), iterations: ITERATIONS, hash: "SHA-256" }, key, KEY_BYTES * 8);
  return buf2hex(new Uint8Array(derived)) === hashHex;
}

// --- JWT (HS256) ---

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + JWT_EXPIRY };
  const segments = [b64url(JSON.stringify(header)), b64url(JSON.stringify(body))];
  const data = toAB(new TextEncoder().encode(segments.join(".")));
  const key = await crypto.subtle.importKey("raw", getSecret(), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  segments.push(b64urlBuf(sig));
  return segments.join(".");
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const data = toAB(new TextEncoder().encode(parts[0] + "." + parts[1]));
    const sig = toAB(b64urlDecode(parts[2]));
    const key = await crypto.subtle.importKey("raw", getSecret(), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// --- Cookie helpers ---

export function authCookie(token: string): string {
  return `wd_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${JWT_EXPIRY}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearAuthCookie(): string {
  return `wd_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/wd_token=([^;]+)/);
  return match?.[1] || null;
}

export async function getUserFromRequest(cookieHeader: string | null): Promise<Record<string, unknown> | null> {
  const token = getTokenFromCookies(cookieHeader);
  if (!token) return null;
  return verifyToken(token);
}

// --- Encoding utils ---

function buf2hex(buf: Uint8Array): string { return [...buf].map(b => b.toString(16).padStart(2, "0")).join(""); }
function hex2buf(hex: string): Uint8Array { return new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16))); }
function b64url(str: string): string { return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlBuf(buf: Uint8Array): string { return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlDecode(str: string): Uint8Array {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return new Uint8Array([...bin].map(c => c.charCodeAt(0)));
}
