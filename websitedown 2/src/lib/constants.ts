// Shared constants — single source of truth for magic numbers and config values.

/** How often the internet-status dashboard auto-refreshes (ms) */
export const DASHBOARD_REFRESH_MS = 30_000;

/** Client-side domain check timeout (ms) */
export const CLIENT_CHECK_TIMEOUT_MS = 8_000;

/** Server-side domain check timeout (ms) */
export const SERVER_CHECK_TIMEOUT_MS = 10_000;

/** Perplexity API request timeout (ms) */
export const PERPLEXITY_TIMEOUT_MS = 15_000;

/** Dedup window for community reports (seconds) */
export const REPORT_DEDUP_WINDOW_SEC = 300;

/** Data retention period (days) */
export const DATA_RETENTION_DAYS = 30;

/** Baseline computation lookback (days) */
export const BASELINE_LOOKBACK_DAYS = 14;
