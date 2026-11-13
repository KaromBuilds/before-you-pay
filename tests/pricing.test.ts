import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  F, PLANS, PRESETS, PRICE_PER_CHECK, cleanInputs, paymentFee, simulate, tenToOneRatio, tenToOneThreshold, passMonthlyThreshold,
} from "../lib/pricing.ts";
import { CONVERSATIONS, tally } from "../lib/evidence.ts";
import { freeLeftFrom, spendFreeFrom, normalizeCode, CODE_RE } from "../lib/quota.ts";
import { analyze } from "../lib/engine.ts";
import { RETURN_RULES } from "../lib/policies.ts";
import { DEMO_EXTRACTION } from "../lib/demo.ts";

const near = (a: number, b: number, tol = 0.051) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test("W14-T1 10:1 thresholds match the brief and the memo", () => {
  assert.equal(PRICE_PER_CHECK, 15);
  near(tenToOneThreshold(15), 625);
  near(tenToOneRatio(F.hotFashionOrder.value, 15), 15.8);
  near(tenToOneRatio(F.hotFashionOrder.value, 25), 9.5); // why the price stayed at MX$15
  near(tenToOneRatio(F.w13Cart.value, 15), 80);
  near(tenToOneRatio(F.founderLoss.value, 15), 105);
  near(passMonthlyThreshold(), 2041.7);
});

test("W14-T2 payment fees: transfer is free; Mercado Pago link = 3.49% + MX$4 + IVA", () => {
  assert.equal(paymentFee(60, "transfer"), 0);
  near(paymentFee(15, "mp_link"), 5.25, 0.01);
  near(paymentFee(60, "mp_link"), 7.07, 0.01);
  near(paymentFee(49, "mp_link"), 6.62, 0.01);
});

test("W14-T3 simulator: monthly adds up, annual = 12×, measured preset earns nothing", () => {
  const base = PRESETS.find((p) => p.id === "base")!.inputs;
  const r = simulate(base);
  near(r.revenue.total, r.revenue.pack + r.revenue.pass + r.revenue.issuer, 1e-9);
  near(r.net, r.revenue.total - r.fees - r.aiCost - r.upkeep, 1e-9);
  near(r.annual.revenue, r.revenue.total * 12, 1e-9);
  near(r.revenue.pack, 500 * 0.03 * PLANS.pack.price, 1e-9); // 15 packs × MX$60 = MX$900
  const m = simulate(PRESETS.find((p) => p.id === "measured")!.inputs);
  assert.equal(m.revenue.total, 0);
  assert.ok(m.net < 0, "with nobody paying, founder hours are a loss");
  assert.equal(m.breakEvenCheckers, null);
});

test("W14-T4 simulator input validation clamps and rejects junk", () => {
  const c = cleanInputs({ checkers: -5, packConv: 7, passConv: "abc", packPrice: 1e12, payment: "bitcoin" } as never);
  assert.equal(c.checkers, 0);
  assert.equal(c.packConv, 1);
  assert.equal(c.passConv, PRESETS[2].inputs.passConv);
  assert.equal(c.packPrice, 1000);
  assert.equal(c.payment, "transfer");
});

test("W14-T5 shadow clause: paying never changes the answer", () => {
  // analyze() takes the cart and the rule, nothing else: no plan, no code, no quota.
  assert.equal(analyze.length, 2);
  const rule = RETURN_RULES.find((r) => r.store.startsWith("Cumbre"))!;
  const free = analyze(structuredClone(DEMO_EXTRACTION), rule);
  // simulate a paid context: quota used up, code active
  const stored = spendFreeFrom(null, new Date("2026-11-13"));
  assert.equal(freeLeftFrom(stored, new Date("2026-11-13")), 0);
  const paid = analyze(structuredClone(DEMO_EXTRACTION), rule);
  assert.deepEqual(paid, free);
  // and the checker passes nothing but (ex, rule) to the engine
  const src = readFileSync(new URL("../components/Checker.tsx", import.meta.url), "utf8");
  const calls = src.match(/analyze\([^)]*\)/g) ?? [];
  assert.deepEqual(calls, ["analyze(ex, rule)"]);
});

test("W14-T6 free limit: 1 a month per device, new month resets", () => {
  const nov = new Date("2026-11-13T12:00:00");
  assert.equal(freeLeftFrom(null, nov), 1);
  const used = spendFreeFrom(null, nov);
  assert.equal(freeLeftFrom(used, nov), 0);
  assert.equal(freeLeftFrom(used, new Date("2026-12-01T12:00:00")), 1);
});

test("W14-T9 code format: normalizes what people type, rejects lookalikes", () => {
  assert.equal(normalizeCode(" byp-ab3d 7kq9 "), "BYP-AB3D-7KQ9");
  assert.equal(normalizeCode("AB3D7KQ9"), "BYP-AB3D-7KQ9");
  assert.equal(normalizeCode("BYP-AB3D-7KQ"), null);
  assert.equal(normalizeCode("BYP-AB0D-7KQ9"), null); // 0 and O are excluded
  assert.ok(CODE_RE.test("BYP-MRZ3-AKBN"));
});

test("W14-T11 ledger: each conversation in exactly one column; nothing paid yet", () => {
  const t = tally();
  assert.equal(t.rejected + t.stated + t.requested + t.paid, CONVERSATIONS.length);
  assert.equal(t.paid, 0);
  for (const c of CONVERSATIONS) assert.ok(!/karom|asael/i.test(c.who), "roles, never names");
});

test("W14-T12 pricing page, simulator and memo read the same file", () => {
  for (const f of ["app/pricing/page.tsx", "components/Simulator.tsx", "app/about/page.tsx"]) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
    assert.match(src, /from "@\/lib\/pricing"/, f);
    assert.doesNotMatch(src, /MX\$15 a check|625|1,286/, `${f} hard-codes a number that belongs in lib/pricing.ts`);
  }
});
