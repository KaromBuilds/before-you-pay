// Week 14 · The free/paid line. Free = 1 full check a month on this device. A pack or pass code unlocks more.
// Team 5 Condition 4 (shadow clause): this file decides HOW MANY checks you get, never WHAT a check says.
// analyze() in lib/engine.ts takes no plan, no code and no quota, so a free and a paid check are identical.
import { FREE_LIMIT_ON, PLANS } from "./pricing.ts";

const QUOTA_KEY = "byp.quota.v1";

export interface QuotaState { month: string; used: number }

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Pure: free checks left this month given what's stored. A new month resets the count. */
export function freeLeftFrom(stored: QuotaState | null, now = new Date()): number {
  if (!FREE_LIMIT_ON) return Infinity;
  const used = stored && stored.month === monthKey(now) ? stored.used : 0;
  return Math.max(0, PLANS.free.checks - used);
}

/** Pure: the state after using one free check. */
export function spendFreeFrom(stored: QuotaState | null, now = new Date()): QuotaState {
  const m = monthKey(now);
  return { month: m, used: (stored && stored.month === m ? stored.used : 0) + 1 };
}

function read(): QuotaState | null {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    return raw ? (JSON.parse(raw) as QuotaState) : null;
  } catch {
    return null;
  }
}
export const freeLeft = () => freeLeftFrom(read());
export function markFreeUsed() {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(spendFreeFrom(read())));
  } catch {}
}

// Codes: see lib/codes.ts (network). Format check lives here so it can be unit-tested.
// ── Code format ─────────────────────────────────────────────────────────────────────
// Format BYP-XXXX-XXXX (no 0/O/1/I). Stored in Supabase only as a SHA-256 hash, behind an RPC.
export const CODE_RE = /^BYP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function normalizeCode(s: string): string | null {
  const c = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = c.startsWith("BYP") ? c.slice(3) : c;
  if (body.length !== 8) return null;
  const code = `BYP-${body.slice(0, 4)}-${body.slice(4)}`;
  return CODE_RE.test(code) ? code : null;
}

