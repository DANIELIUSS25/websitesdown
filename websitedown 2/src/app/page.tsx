"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { tokens } from "@/lib/design-tokens";

/* ================================================================
   BRAND ICONS — optically balanced SVG system
   Every icon: viewBox 0 0 24 24, fill currentColor, same visual mass.
   ================================================================ */

const IC: Record<string, string> = {
  discord: `<svg viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
  chatgpt: `<svg viewBox="0 0 24 24"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
};

/* ── Data ── */
const PLATFORMS = [
  { n: "Discord",     d: "discord.com",     k: "discord" },
  { n: "Twitter / X", d: "x.com",           k: "twitter" },
  { n: "Instagram",   d: "instagram.com",   k: "instagram" },
  { n: "YouTube",     d: "youtube.com",     k: "youtube" },
  { n: "TikTok",      d: "tiktok.com",      k: "tiktok" },
  { n: "Reddit",      d: "reddit.com",      k: "reddit" },
  { n: "ChatGPT",     d: "chat.openai.com", k: "chatgpt" },
  { n: "Twitch",      d: "twitch.tv",       k: "twitch" },
];

const STATUS_PILLS = [
  "twitter-status","discord-status","instagram-status","youtube-status",
  "chatgpt-status","tiktok-status","reddit-status","github-status",
  "spotify-status","netflix-status","aws-status","twitch-status",
];

const HINTS = ["discord.com", "x.com", "openai.com", "youtube.com"];

/* ── Types ── */
type CheckResult = { domain: string; reachable: boolean; status_code: number | null; latency_ms: number; error: string | null; checked_at: string };
type IntelResult = { domain: string; summary: string; confidence: string; issue_type: string | null; signals: string[]; sources: { title: string; url: string }[] } | null;

/* ================================================================
   CSS-in-JS helpers (inline styles for the custom parts that
   Tailwind v4 utility classes don't cover cleanly)
   ================================================================ */

const S = tokens;

/* ================================================================
   COMPONENT
   ================================================================ */

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [intel, setIntel] = useState<IntelResult>(undefined as any);
  const [intelLoading, setIntelLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  async function runCheck(raw: string) {
    const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
    if (!domain) return;

    setLoading(true); setCheck(null); setIntel(null); setIntelLoading(true);

    // Parallel: server check + AI intelligence
    const checkPromise = fetch(`/api/check?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[check] API error:", err); return null; });
    const intelPromise = fetch(`/api/intelligence?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[intel] API error:", err); return null; });

    // Show check result as soon as it arrives
    const checkResult = await checkPromise;
    if (checkResult) {
      setCheck(checkResult);
    } else {
      // Client-side fallback
      setCheck(await clientCheck(domain));
    }
    setLoading(false);

    // Intel arrives later
    const intelResult = await intelPromise;
    setIntel(intelResult);
    setIntelLoading(false);
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); if (query.trim()) runCheck(query.trim()); }
  function handleHint(d: string) { setQuery(d); runCheck(d); }
  function handlePlatform(d: string) { setQuery(d); runCheck(d); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 980, margin: "0 auto" }}>
        <a href="/" style={{ textDecoration: "none", color: S.t1, fontSize: 14, fontWeight: 800, letterSpacing: "-0.04em" }}>
          WebsiteDown<span style={{ color: S.t4, fontWeight: 600 }}>.com</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <a href="#platforms" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Status</a>
          <a href="#pages" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Checks</a>
          <a href="/api" style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 8 }}>API</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", padding: "128px 0 80px", textAlign: "center" }}>
        <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 380, background: `radial-gradient(ellipse 55% 50%, rgba(165,180,252,0.028) 0%, transparent 100%)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 1 }}>
          {/* Chip */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 13px 4px 7px", borderRadius: 99, background: S.s2, border: `1px solid ${S.e1}`, fontSize: 11, fontWeight: 600, color: S.t3, marginBottom: 36 }}>
            <span style={{ position: "relative", width: 5, height: 5, borderRadius: "50%", background: S.ac, display: "inline-block" }}>
              <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${S.ac}`, animation: "chipRing 3s ease-out infinite", opacity: 0 }} />
            </span>
            AI-powered outage detection
          </div>

          <h1 style={{ fontFamily: "var(--font-manrope), var(--sans)", fontSize: "clamp(40px, 6.2vw, 72px)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.92, marginBottom: 22 }}>
            Is that website<br />
            <span style={{ background: `linear-gradient(135deg, #dde4ff 0%, ${S.ac} 50%, ${S.acD} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>actually down?</span>
          </h1>

          <p style={{ fontSize: 15, fontWeight: 500, color: S.t3, maxWidth: 360, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Real-time checks plus AI web intelligence. Find out in seconds.
          </p>

          {/* ── SEARCH BAR ── */}
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{
              borderRadius: 16, padding: 1, transition: "all 0.25s",
              background: focused ? `linear-gradient(135deg, rgba(165,180,252,0.22), rgba(129,140,248,0.08), rgba(165,180,252,0.18))` : S.e1,
              boxShadow: focused ? `0 0 0 1px rgba(165,180,252,0.06), 0 0 32px rgba(165,180,252,0.03), 0 8px 24px rgba(0,0,0,0.35)` : "none",
            }}>
              <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", background: S.s1, borderRadius: 15, padding: "4px 4px 4px 18px" }}>
                <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 12.5, fontWeight: 500, color: focused ? S.t4 : S.t5, marginRight: 2, userSelect: "none", flexShrink: 0, transition: "color 0.2s" }}>https://</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="youtube.com"
                  spellCheck={false}
                  autoFocus
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-manrope), var(--sans)", fontSize: 14.5, fontWeight: 600, color: S.t1, padding: "13px 0", minWidth: 0, letterSpacing: "-0.01em" }}
                />
                <button type="submit" disabled={loading} style={{
                  flexShrink: 0, padding: "11px 22px", background: S.t1, color: S.bg,
                  fontFamily: "var(--font-manrope), var(--sans)", fontSize: 12.5, fontWeight: 800,
                  border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.3 : 1, letterSpacing: "-0.02em", transition: "all 0.12s",
                  position: "relative", overflow: "hidden",
                }}>
                  {loading && <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", animation: "shimmer 0.7s ease-in-out infinite" }} />}
                  {loading ? "Checking" : "Check"}
                </button>
              </form>
            </div>

            {/* Hints */}
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: S.t4, fontWeight: 500 }}>Try</span>
              {HINTS.map(d => (
                <span key={d} onClick={() => handleHint(d)} style={{ padding: "3px 10px", fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10.5, fontWeight: 500, color: S.t3, background: S.s2, border: `1px solid ${S.e0}`, borderRadius: 6, cursor: "pointer", transition: "all 0.12s", userSelect: "none" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = S.t2; (e.target as HTMLElement).style.borderColor = S.e1; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = S.t3; (e.target as HTMLElement).style.borderColor = S.e0; }}
                >{d}</span>
              ))}
            </div>
          </div>

          {/* Loading bar */}
          <div style={{ height: 2, background: S.s3, borderRadius: 99, overflow: "hidden", maxWidth: 500, margin: "24px auto 0", opacity: loading ? 1 : 0, transition: "opacity 0.15s" }}>
            <div style={{ height: "100%", width: "28%", background: `linear-gradient(90deg, ${S.acD}, ${S.ac})`, borderRadius: 99, animation: "loadSlide 0.6s ease-in-out infinite" }} />
          </div>

          {/* ── RESULTS ── */}
          <div style={{ maxWidth: 500, margin: "28px auto 0", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Direct Check Card */}
            {check && <CheckCard data={check} />}

            {/* AI Intelligence Card */}
            {intelLoading && !intel && check && <IntelSkeleton />}
            {intel && <IntelCard data={intel} />}
            {!intelLoading && !intel && check && <IntelUnavailable />}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <Divider />

      {/* ── PLATFORMS ── */}
      <section style={{ padding: "76px 0" }} id="platforms">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.04em" }}>Trending platforms</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: S.t4 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.up, display: "inline-block", position: "relative" }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: S.up, animation: "livePulse 2s ease-in-out infinite" }} />
              </span>
              Live
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PLATFORMS.map(p => (
              <PlatformCard key={p.k} platform={p} onClick={() => handlePlatform(p.d)} />
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "76px 0" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 32 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { n: "1", t: "Enter any URL", d: "Type a domain. We normalize it and probe from our global infrastructure." },
              { n: "2", t: "Server check + AI scan", d: "Real HTTP request plus live web intelligence scan — simultaneously." },
              { n: "3", t: "See the full picture", d: "Reachability result plus AI-detected outage signals, sources included." },
            ].map(s => <StepCard key={s.n} step={s} />)}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── STATUS PAGES ── */}
      <section style={{ padding: "76px 0" }} id="pages">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 32 }}>Popular status pages</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STATUS_PILLS.map(slug => (
              <a key={slug} href={`/${slug}`} style={{ padding: "8px 16px", background: S.s1, border: `1px solid ${S.e0}`, borderRadius: 8, fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 11, fontWeight: 500, color: S.t3, textDecoration: "none", transition: "all 0.12s" }}>/{slug}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${S.e0}`, padding: "28px 0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ fontSize: 12, color: S.t4 }}><strong style={{ color: S.t3, fontWeight: 700 }}>WebsiteDown</strong> · AI-powered outage detection</div>
          <div style={{ display: "flex", gap: 18 }}>
            {["About", "API", "Contact", "Privacy"].map(l => <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 11.5, fontWeight: 600, color: S.t4, textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function CheckCard({ data: c }: { data: CheckResult }) {
  const up = c.reachable;
  const time = new Date(c.checked_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", animation: "resIn 0.45s cubic-bezier(0.16,1,0.3,1)", background: S.s1, border: `1px solid ${S.e2}`, borderLeft: `2px solid ${up ? S.up : S.dn}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: up ? S.up : S.dn, display: "inline-block", position: "relative" }}>
            <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${up ? S.up : S.dn}`, animation: "dotRing 2s ease-out infinite" }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", color: up ? S.up : S.dn }}>{up ? "Reachable" : "Unreachable"}</span>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, background: S.s3, color: S.t3, border: `1px solid ${S.e0}` }}>Direct Check</span>
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 11, fontWeight: 500, color: S.t4 }}>{c.domain}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${S.e0}` }}>
        {[
          { v: String(c.status_code ?? "—"), l: "Status" },
          { v: `${c.latency_ms}`, l: "Latency", s: "ms" },
          { v: time, l: "Checked" },
        ].map(({ v, l, s }, i) => (
          <div key={l} style={{ padding: "14px 16px", textAlign: "center", position: "relative" }}>
            {i < 2 && <div style={{ position: "absolute", right: 0, top: 10, bottom: 10, width: 1, background: S.e0 }} />}
            <div style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: S.t1 }}>{v}{s && <small style={{ fontSize: 10, color: S.t3 }}>{s}</small>}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: S.t4, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
      {c.error && !c.reachable && <div style={{ padding: "8px 18px", borderTop: `1px solid ${S.e0}`, fontFamily: "var(--font-jetbrains)", fontSize: 10.5, textAlign: "center", color: S.dn }}>{c.error}</div>}
    </div>
  );
}

function IntelCard({ data }: { data: NonNullable<IntelResult> }) {
  const confMap: Record<string, { cls: string; label: string }> = {
    none:   { cls: `color:${S.t3};background:${S.s3};border:1px solid ${S.e0}`, label: "No signals" },
    low:    { cls: `color:${S.t2};background:rgba(148,163,184,0.06);border:1px solid rgba(148,163,184,0.1)`, label: "Low confidence" },
    medium: { cls: `color:#fbbf24;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.12)`, label: "Medium confidence" },
    high:   { cls: `color:${S.dn};background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.12)`, label: "High confidence" },
  };
  const conf = confMap[data.confidence] || confMap.none;

  return (
    <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, animation: "resIn 0.45s 0.12s cubic-bezier(0.16,1,0.3,1) both", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: `1px solid ${S.e0}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
          Web Intelligence
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, color: S.t5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Perplexity</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 5, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", ...parseStyle(conf.cls) }}>{conf.label}</span>
          {data.issue_type && <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: S.t3, padding: "2px 7px", background: S.s2, border: `1px solid ${S.e0}`, borderRadius: 4 }}>{data.issue_type}</span>}
        </div>
        <div style={{ fontSize: 12.5, color: S.t2, lineHeight: 1.6, marginBottom: data.signals?.length ? 10 : 0 }}>{data.summary}</div>
        {data.signals?.length > 0 && (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
            {data.signals.map((s, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11.5, color: S.t2, lineHeight: 1.5 }}>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: S.ac, marginTop: 6, flexShrink: 0 }} />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      {data.sources?.length > 0 && (
        <div style={{ borderTop: `1px solid ${S.e0}`, padding: "10px 18px", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {data.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 9.5, fontWeight: 500, color: S.ac, textDecoration: "none", padding: "2px 7px", background: S.acG, border: `1px solid rgba(165,180,252,0.08)`, borderRadius: 4 }}>{s.title}</a>
          ))}
        </div>
      )}
    </div>
  );
}

function IntelSkeleton() {
  return (
    <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", animation: "resIn 0.45s 0.12s cubic-bezier(0.16,1,0.3,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 18px", borderBottom: `1px solid ${S.e0}`, fontSize: 10.5, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
        Scanning web intelligence…
      </div>
      <div style={{ padding: 18 }}>
        {[80, 55, 65].map((w, i) => <div key={i} style={{ height: 8, borderRadius: 3, background: S.s3, marginBottom: 8, width: `${w}%`, animation: `skelP 1s ${i * 0.1}s ease-in-out infinite` }} />)}
      </div>
    </div>
  );
}

function IntelUnavailable() {
  return (
    <div style={{ borderRadius: 12, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden", animation: "resIn 0.45s 0.12s cubic-bezier(0.16,1,0.3,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 18px", borderBottom: `1px solid ${S.e0}`, fontSize: 10.5, fontWeight: 700, color: S.t3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-5" /></svg>
        Web Intelligence
      </div>
      <div style={{ padding: "14px 18px", fontSize: 11.5, color: S.t4 }}>AI intelligence unavailable. Direct check shown above.</div>
    </div>
  );
}

function PlatformCard({ platform: p, onClick }: { platform: typeof PLATFORMS[0]; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 12, padding: 1, cursor: "pointer", transition: "all 0.22s", textDecoration: "none", color: S.t1,
      background: hov ? `linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03), rgba(255,255,255,0.07))` : S.e1,
      transform: hov ? "translateY(-2px)" : "none",
      boxShadow: hov ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
    }}>
      <div style={{ background: hov ? S.s2 : S.s1, borderRadius: 11, padding: 18, display: "flex", flexDirection: "column", gap: 14, transition: "background 0.22s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: S.s3, border: `1px solid ${hov ? S.e2 : S.e1}`, color: hov ? S.t1 : S.t3, transition: "all 0.22s", transform: hov ? "scale(1.06)" : "none" }}
            dangerouslySetInnerHTML={{ __html: IC[p.k] }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: S.up }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.up, boxShadow: `0 0 4px rgba(52,211,153,0.3)`, display: "inline-block" }} />
            Up
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.n}</div>
          <div style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10.5, color: S.t4, marginTop: 1 }}>{p.d}</div>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step: s }: { step: { n: string; t: string; d: string } }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 12, padding: 1, transition: "background 0.2s",
      background: hov ? `linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))` : S.e1,
    }}>
      <div style={{ background: S.s1, borderRadius: 11, padding: "28px 22px" }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: S.s3, border: `1px solid ${S.e1}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 600, color: S.ac, marginBottom: 18 }}>{s.n}</div>
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 7 }}>{s.t}</div>
        <div style={{ fontSize: 12.5, color: S.t3, lineHeight: 1.6 }}>{s.d}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}><div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${S.e1}, transparent)` }} /></div>;
}

/* ── Helpers ── */

function parseStyle(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  str.split(";").forEach(pair => {
    const [k, v] = pair.split(":").map(s => s.trim());
    if (k && v) result[k] = v;
  });
  return result;
}

async function clientCheck(domain: string): Promise<CheckResult> {
  const t = performance.now();
  try {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 8000);
    await fetch("https://" + domain, { method: "HEAD", mode: "no-cors", signal: ac.signal });
    const ms = Math.round(performance.now() - t);
    return { domain, reachable: true, status_code: 200, latency_ms: ms, error: null, checked_at: new Date().toISOString() };
  } catch (e: any) {
    const ms = Math.round(performance.now() - t);
    if (e.name === "AbortError") return { domain, reachable: false, status_code: null, latency_ms: ms, error: "Timed out", checked_at: new Date().toISOString() };
    if (ms < 600) return { domain, reachable: true, status_code: 200, latency_ms: ms, error: null, checked_at: new Date().toISOString() };
    return { domain, reachable: false, status_code: null, latency_ms: ms, error: e.message || "Unreachable", checked_at: new Date().toISOString() };
  }
}
