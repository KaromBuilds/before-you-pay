import type { Decision, Extraction, Result } from "./types";

// Security floor #4: nothing goes raw into the database. Same limits are enforced again by CHECK constraints.
const clip = (s: unknown, n: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n) : "");
const money = (v: unknown) => (typeof v === "number" && isFinite(v) && v >= 0 && v < 10_000_000 ? Math.round(v * 100) / 100 : null);
export const DECISIONS: Decision[] = ["wait", "change_size", "buy_anyway"];

export function toRow(ex: Extraction, r: Result, decision: Decision) {
  if (!DECISIONS.includes(decision)) throw new Error("Invalid decision");
  return {
    store: clip(ex.store ?? r.rule.store, 80) || null,
    items: ex.items.slice(0, 20).map((i) => ({
      name: clip(i.name, 120),
      size: clip(i.size, 20),
      paid: money(i.paidPrice),
      qty: Math.min(50, Math.max(1, Math.floor(i.qty || 1))),
    })),
    amount_paid: money(r.amountPaid),
    money_at_risk: money(r.moneyAtRisk) ?? 0,
    final_sale: money(r.finalSale) ?? 0,
    not_confirmed: money(r.notConfirmed) ?? 0,
    rule_status: r.rule.status,
    flags: r.flags.slice(0, 20).map((f) => clip(f.title, 160)),
    decision,
    source: ex.source,
  };
}
export type CheckRow = ReturnType<typeof toRow> & { id: string; created_at: string };
