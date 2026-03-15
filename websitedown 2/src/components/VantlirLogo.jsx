"use client";

import { useId } from "react";

export function VantlirLogo({
  size = 28,
  showWord = true,
  wordSize = 16
}) {
  const uid = useId().replace(/:/g, "");
  const gradL = `vl-l-${uid}`;
  const gradR = `vl-r-${uid}`;

  const width = Math.round(size * 1.08);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: showWord ? 11 : 0
      }}
    >
      <svg
        width={width}
        height={size}
        viewBox="0 0 28 26"
        fill="none"
        aria-hidden="true"
        style={{
          animation: "vl-logo-pulse 3s ease-in-out infinite",
          flexShrink: 0
        }}
      >
        <defs>
          <linearGradient id={gradL} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#9ee3ff" />
            <stop offset="100%" stopColor="#1a7af0" />
          </linearGradient>

          <linearGradient id={gradR} x1="1" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#9ee3ff" />
            <stop offset="100%" stopColor="#1a7af0" />
          </linearGradient>
        </defs>

        {/* left blade */}
        <polygon
          points="1,1 8.5,1 15.5,22.5 11.5,22.5"
          fill={`url(#${gradL})`}
        />

        {/* right blade */}
        <polygon
          points="27,1 19.5,1 11.5,22.5 15.5,22.5"
          fill={`url(#${gradR})`}
        />

        {/* crossbar */}
        <line
          x1="3.8"
          y1="9.5"
          x2="24.2"
          y2="9.5"
          stroke="rgba(158,227,255,0.35)"
          strokeWidth="0.9"
        />

        {/* apex dot */}
        <circle
          cx="13.5"
          cy="22.5"
          r="2"
          fill="#9ee3ff"
          opacity="0.95"
        />

        {/* highlight seam */}
        <line
          x1="12.5"
          y1="2"
          x2="13.5"
          y2="22.5"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="0.6"
        />
      </svg>

      {showWord && (
        <span
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: wordSize,
            fontWeight: 800,
            color: "#f4faff",
            letterSpacing: "0.3em",
            lineHeight: 1,
            textShadow: "0 0 18px rgba(33,150,255,0.25)"
          }}
        >
          VANTLIR
        </span>
      )}
    </div>
  );
}
