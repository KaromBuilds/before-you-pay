import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/rules.ts";
import { classifyPolicyText, findPolicy, unknownPolicy, POLICY_NOTES } from "../lib/policies.ts";
import { DEMO_EXTRACTION, DEMO_MEMORY, DEMO_REFERENCE } from "../lib/demo.ts";

const demoPolicy = POLICY_NOTES[0];
const noRef = { chestCm: null, lengthCm: null, wristCm: null };

test("T1/T3 demo: amount paid and confirmed final-sale exposure", () => {
  const a = analyze(DEMO_EXTRACTION, [], noRef, demoPolicy);
  assert.equal(a.amountPaid, 6565);
  assert.equal(a.confirmedNonReturnable, 6565);
  assert.equal(a.unconfirmed, 0);
});

test("T2 fit memory: L too big in brand -> high warning on both, never 'will fit'", () => {
  const a = analyze(DEMO_EXTRACTION, DEMO_MEMORY, DEMO_REFERENCE, demoPolicy);
  const high = a.warnings.filter((w) => w.itemId && w.level === "high");
  assert.equal(high.length, 2);
  assert.ok(a.warnings.every((w) => !/will fit/i.test(w.title + w.detail)));
});

test("T4 unknown policy: exposure is unconfirmed, never protected", () => {
  const a = analyze(DEMO_EXTRACTION, [], noRef, unknownPolicy("X", "2026-10-18"));
  assert.equal(a.confirmedNonReturnable, 0);
  assert.equal(a.unconfirmed, 6565);
  assert.equal(a.conditionalExposure, 6565);
});

test("T5 editing a price recalculates", () => {
  const ex = structuredClone(DEMO_EXTRACTION);
  ex.total = null;
  ex.items[0].paidPrice = 1000;
  const a = analyze(ex, [], noRef, demoPolicy);
  assert.equal(a.amountPaid, 1000 + 2748);
});

test("T6 accessory with letter size and no cm -> high", () => {
  const ex = structuredClone(DEMO_EXTRACTION);
  ex.items = [{ id: "b", name: "Beaded bracelet", brand: "Any", size: "M", category: "accessory", listPrice: 300, paidPrice: 300, qty: 1, sizeHasCm: false }];
  ex.discountCodes = [];
  const a = analyze(ex, [], { ...noRef, wristCm: 17 }, demoPolicy);
  const w = a.warnings.find((x) => x.itemId === "b");
  assert.equal(w?.level, "high");
  assert.match(w!.detail, /17 cm/);
});

test("T8 pasted policy text classification", () => {
  assert.deepEqual(classifyPolicyText("Promotional items cannot be returned. Returns within 30 days."), { regular: "yes", discounted: "no" });
  assert.deepEqual(classifyPolicyText("Los artículos con descuento no aplican para devolución. Tienes 30 días para devoluciones."), { regular: "yes", discounted: "no" });
  assert.deepEqual(classifyPolicyText("Contact us for help."), { regular: "unknown", discounted: "unknown" });
  assert.deepEqual(classifyPolicyText("All sales are final."), { regular: "no", discounted: "no" });
});

test("store lookup", () => {
  assert.equal(findPolicy("The North Face")?.status, "unverified");
  assert.equal(findPolicy("Cumbre Outdoor")?.store, "Cumbre Outdoor (fictional)");
  assert.equal(findPolicy("Zara"), null);
});
