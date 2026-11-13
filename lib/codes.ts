// Week 14 · Pack and pass codes, checked and consumed through a Supabase RPC (security definer).
// The table byp_codes is not readable through the public key; codes are stored only as SHA-256 hashes.
import { supabase } from "./supabase";
import { normalizeCode } from "./quota.ts";

const CODE_KEY = "byp.code.v1";

export interface CodeStatus {
  ok: boolean;
  kind?: "pack" | "pass";
  checks_left?: number;
  expires_at?: string | null;
  pass_days?: number;
  reason?: "format" | "unknown" | "used_up" | "expired" | "network";
}

export async function codeStatus(code: string, consume = false): Promise<CodeStatus> {
  const c = normalizeCode(code);
  if (!c) return { ok: false, reason: "format" };
  try {
    const { data, error } = await supabase.rpc("byp_use_check", { p_code: c, p_consume: consume });
    if (error) return { ok: false, reason: "network" };
    return data as CodeStatus;
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function savedCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}
export function saveCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {}
}

export function describeCode(s: CodeStatus): string {
  if (!s.ok) {
    return {
      format: "That doesn't look like a code. Codes look like BYP-AB3D-7KQ9.",
      unknown: "We don't recognize that code. Check it and try again.",
      used_up: "This pack's 4 checks are used.",
      expired: "This 30-day pass has ended.",
      network: "We couldn't check the code right now. Try again in a moment.",
    }[s.reason ?? "unknown"];
  }
  if (s.kind === "pack") return `Pack: ${s.checks_left} check${s.checks_left === 1 ? "" : "s"} left.`;
  if (s.expires_at) return `30-day pass: unlimited checks until ${new Date(s.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`;
  return "30-day pass: your 30 days start with your first check.";
}
