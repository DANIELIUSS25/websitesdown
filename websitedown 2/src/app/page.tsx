"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
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

const S = { ...tokens, t2: "#b0b8c7" };

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
  const [scanStage, setScanStage] = useState(0); // 0=idle, 1-6=stages, 7=done
  const [scanDomain, setScanDomain] = useState("");
  const [scanStart, setScanStart] = useState(0);
  const [trendingData, setTrendingData] = useState<{ service: string; domain: string; status: string; reports_1h: number; anomaly_level: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  // Fetch trending data for search suggestions + sparklines for platform cards
  useEffect(() => {
    fetch("/api/outages").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.services) setTrendingData(d.services);
    }).catch(() => {});
    // Fetch sparkline data for each platform
    Promise.all(
      PLATFORMS.map(p =>
        fetch(`/api/pulse?domain=${encodeURIComponent(p.d)}`).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const map: Record<string, number[]> = {};
      results.forEach((r, i) => {
        if (r?.sparkline_24h) {
          map[PLATFORMS[i].d] = r.sparkline_24h.map((s: any) => s.reports ?? s.down ?? 0);
        }
      });
      setSparklines(map);
    });
  }, []);

  // Close suggestions on click outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  function clearStageTimers() {
    stageTimers.current.forEach(t => clearTimeout(t));
    stageTimers.current = [];
  }

  async function runCheck(raw: string) {
    const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
    if (!domain) return;

    clearStageTimers();
    setLoading(true); setCheck(null); setIntel(null); setIntelLoading(true);
    setScanDomain(domain);
    setScanStart(Date.now());
    setScanStage(1);

    // Auto-advance stages 1-4 on timers (infrastructure check phase)
    // 1=Checking DNS, 2=Testing server response, 3=Measuring latency, 4=Checking CDN edge nodes
    const delays = [600, 1200, 1900, 2600];
    delays.forEach((ms, i) => {
      stageTimers.current.push(setTimeout(() => setScanStage(i + 2), ms));
    });

    // Parallel: server check + AI intelligence
    const checkPromise = fetch(`/api/check?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[check] API error:", err); return null; });
    const intelPromise = fetch(`/api/intelligence?domain=${encodeURIComponent(domain)}`).then(r => r.ok ? r.json() : null).catch(err => { console.error("[intel] API error:", err); return null; });

    // Show check result as soon as it arrives
    const checkResult = await checkPromise;
    if (checkResult) {
      setCheck(checkResult);
    } else {
      setCheck(await clientCheck(domain));
    }

    // After check completes, advance to stage 5 (Scanning web intelligence)
    clearStageTimers();
    setScanStage(prev => Math.max(prev, 5));

    // Intel arrives later — advance to stage 6 (Analyzing outage signals)
    stageTimers.current.push(setTimeout(() => setScanStage(prev => Math.max(prev, 6)), 800));

    const intelResult = await intelPromise;
    clearStageTimers();
    setScanStage(6);
    setIntel(intelResult);
    setIntelLoading(false);

    // Brief pause on final stage then reveal results
    await new Promise(r => setTimeout(r, 600));
    setScanStage(7);
    setLoading(false);
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
          <a href="#outages" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Outages</a>
          <a href="#platforms" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Status</a>
          <a href="#pages" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Checks</a>
          <a href="/pricing" style={{ padding: "6px 12px", fontSize: 12.5, fontWeight: 600, color: S.t3, textDecoration: "none", borderRadius: 8 }}>Pricing</a>
          <a href="/dashboard" style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, color: S.bg, background: S.t1, textDecoration: "none", borderRadius: 8 }}>Dashboard</a>
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
          <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }} ref={suggestRef}>
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
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { setFocused(true); setShowSuggestions(true); }}
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

            {/* ── TRENDING SUGGESTIONS DROPDOWN ── */}
            {showSuggestions && !loading && scanStage === 0 && trendingData.length > 0 && (
              <TrendingSuggestions
                data={trendingData}
                query={query}
                onSelect={(d) => { setShowSuggestions(false); setQuery(d); runCheck(d); }}
              />
            )}

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

          {/* Scan Progress */}
          {loading && scanStage > 0 && scanStage < 7 && <ScanProgress stage={scanStage} domain={scanDomain} startTime={scanStart} />}

          {/* ── RESULTS ── */}
          <div style={{ maxWidth: 500, margin: "28px auto 0", display: "flex", flexDirection: "column", gap: 10 }}>
            {scanStage === 7 && check && <CheckCard data={check} />}
            {scanStage === 7 && intel && <IntelCard data={intel} />}
            {scanStage === 7 && !intelLoading && !intel && check && <IntelUnavailable />}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <Divider />

      {/* ── CURRENT INTERNET OUTAGES ── */}
      <CurrentOutages />

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
            {PLATFORMS.map(p => {
              const svcData = trendingData.find(t => t.domain === p.d);
              return (
                <PlatformCard
                  key={p.k}
                  platform={p}
                  onClick={() => handlePlatform(p.d)}
                  sparkline={sparklines[p.d]}
                  status={svcData?.status as any}
                  reports={svcData?.reports_1h ?? 0}
                />
              );
            })}
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
   TRENDING SUGGESTIONS — search dropdown
   ================================================================ */

type TrendingItem = { service: string; domain: string; status: string; reports_1h: number; anomaly_level: string };

function TrendingSuggestions({ data, query, onSelect }: { data: TrendingItem[]; query: string; onSelect: (domain: string) => void }) {
  const q = query.trim().toLowerCase();

  // Filter: if query is typed, match against name/domain; otherwise show trending
  const filtered = q
    ? data.filter(d => d.service.toLowerCase().includes(q) || d.domain.toLowerCase().includes(q)).slice(0, 6)
    : data.slice(0, 8);

  if (filtered.length === 0 && q) return null;

  // Separate services with issues from operational ones
  const withIssues = filtered.filter(d => d.status !== "operational" || d.anomaly_level !== "normal" || d.reports_1h > 0);
  const operational = filtered.filter(d => d.status === "operational" && d.anomaly_level === "normal" && d.reports_1h === 0);

  const statusDot: Record<string, string> = { operational: S.up, degraded: S.warn, down: S.dn, unknown: S.t4 };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
      borderRadius: 14, background: S.s1, border: `1px solid ${S.e2}`,
      boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
      overflow: "hidden", animation: "resIn 0.2s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Header */}
      <div style={{ padding: "9px 14px", borderBottom: `1px solid ${S.e0}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.ac, display: "inline-block" }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: S.t3 }}>
            {q ? "Search results" : "Trending now"}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9, color: S.t5 }}>Live status</span>
      </div>

      {/* Services with issues first */}
      {withIssues.length > 0 && (
        <div>
          {withIssues.map((item, i) => (
            <SuggestionRow key={item.domain} item={item} statusDot={statusDot} onSelect={onSelect} isLast={i === withIssues.length - 1 && operational.length === 0} />
          ))}
        </div>
      )}

      {/* Divider between issues and operational */}
      {withIssues.length > 0 && operational.length > 0 && (
        <div style={{ padding: "0 14px" }}><div style={{ height: 1, background: S.e0 }} /></div>
      )}

      {/* Operational services */}
      {operational.length > 0 && (
        <div>
          {operational.map((item, i) => (
            <SuggestionRow key={item.domain} item={item} statusDot={statusDot} onSelect={onSelect} isLast={i === operational.length - 1} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "7px 14px", borderTop: `1px solid ${S.e0}`, background: S.s2 }}>
        <span style={{ fontSize: 9.5, color: S.t4, fontWeight: 500 }}>
          {q ? "Press Enter to check any domain" : "Type a domain or select a service"}
        </span>
      </div>
    </div>
  );
}

function SuggestionRow({ item, statusDot, onSelect, isLast }: { item: TrendingItem; statusDot: Record<string, string>; onSelect: (d: string) => void; isLast: boolean }) {
  const [hov, setHov] = useState(false);
  const dot = statusDot[item.status] || S.t4;
  const hasIssue = item.status !== "operational" || item.anomaly_level !== "normal" || item.reports_1h > 0;

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); onSelect(item.domain); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
        cursor: "pointer", transition: "background 0.1s",
        background: hov ? S.s2 : "transparent",
      }}
    >
      {/* Status dot */}
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0, position: "relative" }}>
        {item.status === "down" && <span style={{ position: "absolute", inset: -2, borderRadius: "50%", border: `1px solid ${S.dn}`, animation: "dotRing 2s ease-out infinite" }} />}
      </span>

      {/* Service info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: S.t1, letterSpacing: "-0.01em" }}>{item.service}</span>
        <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10, color: S.t4, marginLeft: 8 }}>{item.domain}</span>
      </div>

      {/* Status / report badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {item.reports_1h > 0 && (
          <span style={{
            fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9.5, fontWeight: 600,
            padding: "2px 7px", borderRadius: 4,
            color: item.anomaly_level === "major" ? S.dn : item.anomaly_level === "elevated" ? S.warn : S.t3,
            background: item.anomaly_level === "major" ? S.dnBg : item.anomaly_level === "elevated" ? S.warnBg : S.s3,
            border: `1px solid ${item.anomaly_level === "major" ? S.dnBd : item.anomaly_level === "elevated" ? S.warnBd : S.e0}`,
          }}>
            {item.reports_1h} report{item.reports_1h !== 1 ? "s" : ""}
          </span>
        )}
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
          color: dot,
        }}>
          {item.status === "down" ? "Down" : item.status === "degraded" ? "Slow" : "Up"}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

const SCAN_STAGES = [
  { label: "Checking DNS", sub: "Resolving domain nameservers", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z", eta: 1 },
  { label: "Testing server response", sub: "HTTP probe from edge infrastructure", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-6-1h4v-2h-4v2zm-8-3h10v-2H6v2zm0-3h10V9H6v2z", eta: 2 },
  { label: "Measuring latency", sub: "Round-trip timing analysis", icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z", eta: 3 },
  { label: "Checking CDN edge nodes", sub: "Probing global delivery network", icon: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.82-4 4.03-4h.33l.29-.71C7.6 7.32 9.68 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z", eta: 4 },
  { label: "Scanning web intelligence", sub: "AI outage signal detection", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z", eta: 7 },
  { label: "Analyzing outage signals", sub: "Cross-referencing intelligence sources", icon: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z", eta: 9 },
];

const TOTAL_ETA_SEC = 10;

function ScanProgress({ stage, domain, startTime }: { stage: number; domain: string; startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [stageElapsed, setStageElapsed] = useState(0);
  const stageStartRef = useRef(startTime);

  // Track when stage changes
  useEffect(() => {
    stageStartRef.current = Date.now();
  }, [stage]);

  // Tick elapsed time
  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTime) / 100) / 10);
      setStageElapsed(Math.round((Date.now() - stageStartRef.current) / 100) / 10);
    }, 100);
    return () => clearInterval(iv);
  }, [startTime]);

  const pct = Math.min(Math.round((stage / SCAN_STAGES.length) * 100), 100);
  const currentStage = SCAN_STAGES[stage - 1];
  const etaRemaining = Math.max(0, TOTAL_ETA_SEC - elapsed);

  return (
    <div style={{ maxWidth: 500, margin: "28px auto 0", animation: "resIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ borderRadius: 14, background: S.s1, border: `1px solid ${S.e1}`, overflow: "hidden" }}>

        {/* ── Header bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${S.e0}`, background: S.s2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.ac, position: "relative", flexShrink: 0 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: S.ac, animation: "livePulse 2s ease-in-out infinite" }} />
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: S.t3 }}>Infrastructure Diagnostic</span>
          </div>
          <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10, fontWeight: 500, color: S.t4 }}>{domain}</span>
        </div>

        {/* ── Progress bar with percentage ── */}
        <div style={{ padding: "10px 16px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 4, background: S.s3, borderRadius: 99, overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${S.acD}, ${S.ac})`,
              borderRadius: 99,
              transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              position: "relative",
            }}>
              {/* Shimmer on progress bar */}
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shimmer 1.2s ease-in-out infinite" }} />
            </div>
          </div>
          <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 11, fontWeight: 700, color: S.ac, minWidth: 32, textAlign: "right" }}>{pct}%</span>
        </div>

        {/* ── Timing row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 16px 10px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9.5, color: S.t4 }}>
            Elapsed {elapsed.toFixed(1)}s
          </span>
          <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9.5, color: S.t4 }}>
            ETA ~{etaRemaining.toFixed(0)}s remaining
          </span>
        </div>

        {/* ── Stage list ── */}
        <div style={{ padding: "4px 16px 14px" }}>
          {SCAN_STAGES.map((s, i) => {
            const idx = i + 1;
            const isActive = idx === stage;
            const isDone = idx < stage;
            const isPending = idx > stage;

            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 0",
                opacity: isPending ? 0.2 : isDone ? 0.55 : 1,
                transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                transform: isActive ? "translateX(3px)" : "none",
              }}>
                {/* Step indicator */}
                <div style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? S.acG : isDone ? "rgba(52,211,153,0.06)" : S.s2,
                  border: `1px solid ${isActive ? "rgba(165,180,252,0.2)" : isDone ? "rgba(52,211,153,0.15)" : S.e0}`,
                  transition: "all 0.35s",
                  boxShadow: isActive ? "0 0 12px rgba(165,180,252,0.08)" : "none",
                }}>
                  {isDone ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={S.up}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  ) : isActive ? (
                    <span style={{
                      width: 11, height: 11, borderRadius: "50%",
                      border: `1.5px solid ${S.e1}`, borderTopColor: S.ac,
                      animation: "scanSpin 0.55s linear infinite",
                    }} />
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill={S.t5}><path d={s.icon}/></svg>
                  )}
                </div>

                {/* Label + sub */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: isActive ? 700 : 500, letterSpacing: "-0.01em",
                    color: isActive ? S.t1 : isDone ? S.t3 : S.t4,
                    transition: "all 0.3s",
                  }}>{s.label}</div>
                  {isActive && (
                    <div style={{
                      fontSize: 9.5, color: S.t4, marginTop: 1,
                      fontFamily: "var(--font-jetbrains), var(--mono)",
                      animation: "resIn 0.3s cubic-bezier(0.16,1,0.3,1)",
                    }}>{s.sub}</div>
                  )}
                </div>

                {/* Right side: timing */}
                {isActive && (
                  <span style={{
                    fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9.5,
                    color: S.ac, fontWeight: 600, whiteSpace: "nowrap",
                    animation: "resIn 0.3s cubic-bezier(0.16,1,0.3,1)",
                  }}>{stageElapsed.toFixed(1)}s</span>
                )}
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={S.up} style={{ opacity: 0.5, flexShrink: 0 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Active stage highlight bar ── */}
        {currentStage && (
          <div style={{
            borderTop: `1px solid ${S.e0}`, padding: "9px 16px",
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(165,180,252,0.02)",
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.ac, flexShrink: 0, animation: "livePulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10, color: S.t3, fontWeight: 500 }}>
              {currentStage.sub}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9, color: S.t5 }}>
              Stage {stage}/{SCAN_STAGES.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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
          AI Analysis
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
        Scanning AI intelligence…
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
        AI Analysis
      </div>
      <div style={{ padding: "14px 18px", fontSize: 11.5, color: S.t4 }}>AI analysis unavailable. Direct check shown above.</div>
    </div>
  );
}

function PlatformCard({ platform: p, onClick, sparkline, status, reports }: { platform: typeof PLATFORMS[0]; onClick: () => void; sparkline?: number[]; status?: string; reports?: number }) {
  const [hov, setHov] = useState(false);
  const statusColor = status === "down" ? S.dn : status === "degraded" ? S.warn : S.up;
  const statusLabel = status === "down" ? "Down" : status === "degraded" ? "Slow" : "Up";
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      borderRadius: 12, padding: 1, cursor: "pointer", transition: "all 0.22s", textDecoration: "none", color: S.t1,
      background: hov ? `linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03), rgba(255,255,255,0.07))` : S.e1,
      transform: hov ? "translateY(-2px)" : "none",
      boxShadow: hov ? "0 12px 32px rgba(0,0,0,0.25)" : "none",
    }}>
      <div style={{ background: hov ? S.s2 : S.s1, borderRadius: 11, padding: 18, display: "flex", flexDirection: "column", gap: 10, transition: "background 0.22s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: S.s3, border: `1px solid ${hov ? S.e2 : S.e1}`, color: hov ? S.t1 : S.t3, transition: "all 0.22s", transform: hov ? "scale(1.06)" : "none" }}
            dangerouslySetInnerHTML={{ __html: IC[p.k] }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: statusColor }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: statusColor, boxShadow: `0 0 4px ${statusColor}33`, display: "inline-block" }} />
            {statusLabel}
          </div>
        </div>

        {/* Mini sparkline */}
        <MiniSparkline data={sparkline} reports={reports} />

        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.n}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
            <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10.5, color: S.t4 }}>{p.d}</span>
            {(reports ?? 0) > 0 && (
              <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 9, color: S.t4 }}>{reports} rpt{(reports ?? 0) !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ data, reports }: { data?: number[]; reports?: number }) {
  if (!data || data.length === 0) {
    // Render flat line placeholder
    return (
      <svg width="100%" height={24} viewBox="0 0 120 24" preserveAspectRatio="none" style={{ display: "block" }}>
        <line x1={0} x2={120} y1={20} y2={20} stroke={S.e1} strokeWidth={1} />
      </svg>
    );
  }

  const w = 120, h = 24;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const hasSpike = data.some(v => v >= 20);
  const lineColor = hasSpike ? S.dn : (reports && reports > 0) ? S.warn : S.ac;
  const fillColor = hasSpike ? S.dn : (reports && reports > 0) ? S.warn : S.ac;

  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;

  // Peak dot
  const peakVal = Math.max(...data);
  const peakIdx = data.indexOf(peakVal);
  const peakX = peakIdx * step;
  const peakY = h - 2 - (peakVal / max) * (h - 4);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block", borderRadius: 4 }}>
      <path d={area} fill={fillColor} opacity={0.06} />
      <path d={line} fill="none" stroke={lineColor} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      {peakVal > 0 && <circle cx={peakX} cy={peakY} r={1.5} fill={lineColor} opacity={0.8} />}
    </svg>
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

/* ================================================================
   CURRENT INTERNET OUTAGES — live outage feed
   ================================================================ */

type OutageService = {
  service: string;
  domain: string;
  category: string;
  status: "operational" | "degraded" | "down" | "unknown";
  latency_ms: number | null;
  reports_15m: number;
  reports_1h: number;
  baseline: number;
  anomaly_level: string;
  trend: "stable" | "rising" | "spike";
};
type OutageData = { services: OutageService[]; outages: OutageService[]; total: number; operational: number; issues: number; generated_at: string };

function CurrentOutages() {
  const [data, setData] = useState<OutageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchOutages = useCallback(async () => {
    try {
      const r = await fetch("/api/outages");
      if (r.ok) {
        const d: OutageData = await r.json();
        setData(d);
        setLastUpdate(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOutages();
    const iv = setInterval(fetchOutages, 30_000);
    return () => clearInterval(iv);
  }, [fetchOutages]);

  if (loading) {
    return (
      <section style={{ padding: "76px 0" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
          <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 32 }}>Current Internet Outages</h2>
          <div style={{ display: "grid", gap: 6 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 56, borderRadius: 10, background: S.s1, border: `1px solid ${S.e0}`, animation: `skelP 1s ${i * 0.1}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  // Combine: show outages first, then all services sorted by status
  const statusOrder: Record<string, number> = { down: 0, degraded: 1, unknown: 2, operational: 3 };
  const sorted = [...data.services].sort((a, b) => {
    const aO = a.anomaly_level !== "normal" ? -1 : (statusOrder[a.status] ?? 3);
    const bO = b.anomaly_level !== "normal" ? -1 : (statusOrder[b.status] ?? 3);
    if (aO !== bO) return aO - bO;
    return b.reports_1h - a.reports_1h;
  });

  const hasIssues = data.outages.length > 0;

  return (
    <section style={{ padding: "76px 0" }} id="outages">
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-manrope)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.04em" }}>Current Internet Outages</h2>
            {hasIssues && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: S.dn, background: S.dnBg, border: `1px solid ${S.dnBd}` }}>
                {data.issues} issue{data.issues !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: S.t4 }}>
            {lastUpdate && <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10 }}>{lastUpdate}</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.up, display: "inline-block", position: "relative" }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: S.up, animation: "livePulse 2s ease-in-out infinite" }} />
              </span>
              Live
            </span>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <SummaryChip label="Tracked" value={data.total} />
          <SummaryChip label="Operational" value={data.operational} color={S.up} />
          {data.issues > 0 && <SummaryChip label="Issues" value={data.issues} color={S.dn} />}
        </div>

        {/* Global status banner */}
        {!hasIssues && (
          <div style={{
            borderRadius: 10, padding: "14px 18px", marginBottom: 16,
            background: S.upBg, border: `1px solid ${S.upBd}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.up }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: S.up }}>All monitored services are operational</span>
          </div>
        )}

        {/* Service rows */}
        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${S.e1}` }}>
          {sorted.slice(0, 12).map((svc, i) => (
            <OutageRow key={svc.domain} svc={svc} isLast={i === Math.min(sorted.length, 12) - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: S.s1, border: `1px solid ${S.e0}`, fontSize: 11, fontWeight: 600 }}>
      <span style={{ color: S.t4 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", color: color || S.t2 }}>{value}</span>
    </div>
  );
}

function OutageRow({ svc, isLast }: { svc: OutageService; isLast: boolean }) {
  const [hov, setHov] = useState(false);

  const statusColors: Record<string, { dot: string; label: string; text: string }> = {
    operational: { dot: S.up, label: "Operational", text: S.up },
    degraded: { dot: S.warn, label: "Degraded", text: S.warn },
    down: { dot: S.dn, label: "Down", text: S.dn },
    unknown: { dot: S.t4, label: "Unknown", text: S.t4 },
  };
  const st = statusColors[svc.status] || statusColors.unknown;

  const trendLabels: Record<string, { text: string; color: string; icon: string }> = {
    spike: { text: "major spike", color: S.dn, icon: "\u2191\u2191" },
    rising: { text: "rising", color: S.warn, icon: "\u2191" },
    stable: { text: "stable", color: S.t4, icon: "\u2192" },
  };
  const tr = trendLabels[svc.trend] || trendLabels.stable;

  return (
    <a
      href={`/status/${svc.domain}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 16,
        padding: "12px 18px",
        background: hov ? S.s2 : S.s1,
        borderBottom: isLast ? "none" : `1px solid ${S.e0}`,
        textDecoration: "none", color: S.t1,
        transition: "background 0.15s",
      }}
    >
      {/* Service name + domain */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, flexShrink: 0, position: "relative" }}>
          {svc.status === "down" && <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `1px solid ${S.dn}`, animation: "dotRing 2s ease-out infinite" }} />}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{svc.service}</span>
        <span style={{ fontFamily: "var(--font-jetbrains), var(--mono)", fontSize: 10, color: S.t4, whiteSpace: "nowrap" }}>{svc.domain}</span>
      </div>

      {/* Status */}
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: st.text, whiteSpace: "nowrap" }}>{st.label}</span>

      {/* Reports */}
      {svc.reports_1h > 0 ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 600, fontFamily: "var(--font-jetbrains), var(--mono)", color: tr.color, background: svc.anomaly_level !== "normal" ? (svc.anomaly_level === "major" ? S.dnBg : S.warnBg) : S.s3, border: `1px solid ${svc.anomaly_level === "major" ? S.dnBd : svc.anomaly_level === "elevated" ? S.warnBd : S.e0}`, whiteSpace: "nowrap" }}>
          <span>{svc.reports_1h} report{svc.reports_1h !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 9 }}>{tr.icon}</span>
        </span>
      ) : (
        <span style={{ fontSize: 10, color: S.t5, fontFamily: "var(--font-jetbrains), var(--mono)" }}>0 reports</span>
      )}

      {/* Trend label */}
      {svc.anomaly_level !== "normal" && (
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 4, color: svc.anomaly_level === "major" ? S.dn : S.warn, background: svc.anomaly_level === "major" ? S.dnBg : S.warnBg, border: `1px solid ${svc.anomaly_level === "major" ? S.dnBd : S.warnBd}`, whiteSpace: "nowrap" }}>
          {svc.anomaly_level === "major" ? "major spike" : "elevated"}
        </span>
      )}
      {svc.anomaly_level === "normal" && <span />}
    </a>
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
