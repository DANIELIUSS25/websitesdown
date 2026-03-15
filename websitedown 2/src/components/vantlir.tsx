"use client";

import { tokens } from "@/lib/design-tokens";

const S = tokens;

/**
 * Vantlir logo mark — minimal "V" chevron icon.
 */
export function VantlirLogo({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vantlir"
    >
      <path
        d="M2 6l10 13L22 6"
        stroke={S.t3}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * "Powered by Vantlir" badge — subtle, dark-theme-native.
 * Links to https://vantlir.com.
 */
export function PoweredByVantlir({ style }: { style?: React.CSSProperties }) {
  return (
    <a
      href="https://vantlir.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontWeight: 600,
        color: S.t4,
        textDecoration: "none",
        letterSpacing: "-0.01em",
        transition: "color 0.15s",
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = S.t3)}
      onMouseLeave={e => (e.currentTarget.style.color = S.t4)}
    >
      <VantlirLogo size={12} />
      <span>Powered by <span style={{ fontWeight: 800 }}>Vantlir</span></span>
    </a>
  );
}
