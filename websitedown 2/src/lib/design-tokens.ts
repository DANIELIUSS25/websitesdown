// Shared design tokens used across all client components.
// Single source of truth for colors, fonts, and styling constants.

export const tokens = {
  // Backgrounds
  bg: "#060709",
  s1: "#0b0d12",
  s2: "#10131a",
  s3: "#161921",
  s4: "#1c2029",

  // Edges / borders (translucent white)
  e0: "rgba(255,255,255,0.03)",
  e1: "rgba(255,255,255,0.055)",
  e2: "rgba(255,255,255,0.09)",

  // Text hierarchy
  t1: "#eef0f4",
  t2: "#9ba3b0",
  t3: "#6e7a8e",
  t4: "#3d4758",
  t5: "#252d3b",

  // Accent (indigo)
  ac: "#a5b4fc",
  acD: "#818cf8",
  acG: "rgba(165,180,252,0.06)",
  acGS: "rgba(165,180,252,0.12)",

  // Semantic colors
  up: "#34d399",
  upBg: "rgba(52,211,153,0.06)",
  upBd: "rgba(52,211,153,0.12)",
  upE: "rgba(52,211,153,0.18)",

  dn: "#f87171",
  dnBg: "rgba(248,113,113,0.06)",
  dnBd: "rgba(248,113,113,0.12)",
  dnE: "rgba(248,113,113,0.18)",

  warn: "#fbbf24",
  warnBg: "rgba(251,191,36,0.06)",
  warnBd: "rgba(251,191,36,0.12)",

  // Font stacks
  mono: "var(--font-jetbrains),'JetBrains Mono',ui-monospace,monospace",
  sans: "var(--font-manrope),'Manrope',system-ui,sans-serif",
} as const;
