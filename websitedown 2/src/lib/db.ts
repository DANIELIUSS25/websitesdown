// src/lib/db.ts
// Neon Postgres connection for serverless functions.
// Uses @neondatabase/serverless which works over HTTP (no TCP needed).
// Install: npm install @neondatabase/serverless

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("[db] No DATABASE_URL found â database features will fail");
}

const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

export const db = {
  async query(text: string, params: any[] = []) {
    if (!sql) throw new Error("Database not configured");
    // neon() returns rows directly for tagged template, but we need parameterized queries
    // Use the raw query interface
    const rows = await sql(text, params);
    return { rows, rowCount: rows.length };
  },
};
