import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, BANNED } from "../lib/engine.ts";
import { RETURN_RULES, findRule, resolveRule, unknownRule, classifyPolicyText } from "../lib/policies.ts";
import { DEMO_EXTRACTION } from "../lib/demo.ts";
import { toRow } from "../lib/validate.ts";
import type { Extraction } from "../lib/types.ts";

const cumbre = RETURN_RULES.find((r) => r.store.startsWith("Cumbre"))!;
const zara = RETURN_RULES.find((r) => r.store.startsWith("Zara"))!;
const pants: Extraction = {
  store: "ZARA",
  items: [
    { id: "a", name: "Wide-leg pants", brand: "Zara", size: "32", category: "apparel", listPrice: 999, paidPrice: 849, qty: 1 },
    { id: "b", name: "Wide-leg pants", brand: "Zara", size: "32", category: "apparel", listPrice: 999, paidPrice: 849, qty: 1 },
  ],
  discountCodes: [],
  shipping: null,
  total: null,
  returnTermsVisible: null,
  pressureCues: ["Ends in 01:59:00"],
  source: "screenshot",
  checkedAt: "2026-11-01",
};

test("T1/T2 fictional sample: discounted items are confirmed final sale", () => {
  const r = analyze(DEMO_EXTRACTION, cumbre);
  assert.equal(r.amountPaid, 6565);
  assert.equal(r.finalSale, 6565);
  assert.equal(r.notConfirmed, 0);
  assert.equal(r.moneyAtRisk, 6565);
  assert.equal(r.flags[0].id, "final-sale");
});

test("T3 Zara discounted: rule not stated -> counted as not confirmed, never protected", () => {
  assert.equal(findRule("ZARA")?.store, "Zara México");
  const r = analyze(pants, zara);
  assert.equal(r.notConfirmed, 1698);
  assert.equal(r.finalSale, 0);
  assert.equal(r.moneyAtRisk, 1698);
});

test("T3b Zara full price: advertised 30-day return -> not at risk, cost note shown", () => {
  const full = { ...pants, items: pants.items.map((i) => ({ ...i, listPrice: null })) };
  const r = analyze(full, zara);
  assert.equal(r.moneyAtRisk, 0);
  assert.ok(r.flags.some((f) => f.id === "return-cost"));
});

test("T4 unknown store: every peso is not confirmed", () => {
  const r = analyze(DEMO_EXTRACTION, unknownRule("Tienda X", "2026-11-01"));
  assert.equal(r.notConfirmed, 6565);
  assert.equal(r.moneyAtRisk, 6565);
});

test("T5 editing a price recalculates", () => {
  const ex = { ...pants, items: [{ ...pants.items[0], paidPrice: 500 }, pants.items[1]] };
  assert.equal(analyze(ex, zara).moneyAtRisk, 1349);
});

test("T6/T7 duplicates and pressure cues are flagged", () => {
  const ids = analyze(pants, zara).flags.map((f) => f.id);
  assert.ok(ids.includes("duplicates"));
  assert.ok(ids.includes("pressure"));
  const q = { ...pants, items: [{ ...pants.items[0], qty: 2 }] };
  assert.ok(analyze(q, zara).flags.some((f) => f.id === "duplicates"));
});

test("T8 every flag ends in exactly one non-empty next step", () => {
  for (const ex of [pants, DEMO_EXTRACTION])
    for (const rule of [zara, cumbre, unknownRule(null, "2026-11-01")])
      for (const f of analyze(ex, rule).flags) assert.ok(f.nextStep.trim().length > 10, f.id);
});

test("T9 the output never claims certainty", () => {
  for (const ex of [pants, DEMO_EXTRACTION])
    for (const rule of RETURN_RULES) {
      const r = analyze(ex, rule);
      const text = r.flags.map((f) => f.title + f.detail + f.nextStep).join(" ") + r.nextStep;
      assert.ok(!BANNED.test(text), text.match(BANNED)?.[0]);
    }
});

test("missing size is a high flag", () => {
  const ex = { ...pants, items: [{ ...pants.items[0], size: "" }] };
  assert.ok(analyze(ex, zara).flags.some((f) => f.id.startsWith("no-size") && f.level === "high"));
});

test("pasted text overrides the table only on explicit wording", () => {
  const r = resolveRule("ZARA", null, "Los artículos en promoción no aceptan devoluciones.", "2026-11-01");
  assert.equal(r.discountedReturnable, "no");
  assert.equal(r.regularReturnable, "yes"); // keeps the table's advertised rule
  const vague = resolveRule("ZARA", null, "Gracias por tu compra, vuelve pronto a la tienda.", "2026-11-01");
  assert.equal(vague.store, "Zara México");
  assert.deepEqual(classifyPolicyText("Venta final en artículos de liquidación"), { regular: "unknown", discounted: "no" });
});

test("saved row holds no image and is clipped", () => {
  const r = analyze(pants, zara);
  const row = toRow({ ...pants, items: [{ ...pants.items[0], name: "x".repeat(500) }] }, r, "wait");
  assert.equal(row.items[0].name.length, 120);
  assert.ok(!("image" in row));
  assert.throws(() => toRow(pants, r, "hack" as never));
});

test("bug fix: similar but different items are named as a pair, not 'twice'", () => {
  const f = analyze(DEMO_EXTRACTION, cumbre).flags.find((x) => x.id === "duplicates")!;
  assert.ok(f.detail.includes('"Hooded Thermal Puffer Jacket" and "Thermal Puffer Jacket" are very similar'));
  assert.ok(!f.detail.includes("appears twice"));
  const g = analyze(pants, zara).flags.find((x) => x.id === "duplicates")!;
  assert.ok(g.detail.includes('"Wide-leg pants" appears twice'));
});
