"use client";

import { tokens } from "@/lib/design-tokens";
import { VantlirLogo } from "@/components/VantlirLogo";

const S = tokens;

/**
 * "Powered by Vantlir" badge — subtle, dark-theme-native.
 * Uses the full VantlirLogo SVG (icon-only, no wordmark) at small size.
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
        gap: 6,
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
      <VantlirLogo size={14} showWord={false} />
      <span>Powered by <span style={{ fontWeight: 800 }}>Vantlir</span></span>
    </a>
  );
}
