// Week 15 · the rule desk. T2 (source + date), T3 (lint), T4 (single source of truth), T7 (store request input).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PIECES, SERIES, finished, lintPiece, lintText, cleanStoreName, readSrc, pieceLink } from "../lib/content.ts";
import { RETURN_RULES } from "../lib/policies.ts";

const TODAY = "2026-11-22";

test("Playbook shape: six concepts, two per series, one finished per series, three formats", () => {
  assert.equal(PIECES.length, 6);
  for (const s of SERIES) {
    const of = PIECES.filter((p) => p.series === s.id);
    assert.equal(of.length, 2, s.id);
    assert.equal(of.filter((p) => p.status === "finished").length, 1, s.id);
  }
  assert.deepEqual(new Set(finished().map((p) => p.format)), new Set(["image", "video", "text"]));
  assert.equal(new Set(PIECES.map((p) => p.id)).size, PIECES.length, "ids are unique");
});

test("T2/T3 every finished piece passes the lint, has a source and a check date within 30 days", () => {
  for (const p of finished()) assert.deepEqual(lintPiece(p, TODAY), [], p.id);
});

test("T2 a stale check date blocks a piece", () => {
  const p = finished()[0];
  assert.match(lintPiece(p, "2027-01-15").join(), /not within 30 days/);
});

test("T3 the 'before' draft from the playbook fails, for named reasons", () => {
  const before = "⚠️ STOP!! Zara will NOT take back your sale items! Only today: check your cart before it's too late!!";
  const why = lintText(before);
  for (const r of ["exclamation mark", "only today", "urgency phrase", "alarm emoji", "ALL-CAPS"]) assert.ok(why.some((w) => w.includes(r)), r);
});

test("T3 promises are blocked; quoting a checkout's pressure to name it is not", () => {
  assert.ok(lintText("Relax, this size will fit.").length);
  assert.ok(lintText("Don't worry, you can return it.").length);
  assert.ok(lintText("You'll get your money back.").length);
  assert.ok(lintText("It's 100% refundable.").length);
  assert.deepEqual(lintText("The screen shows “Only 3 left in L” next to the pay button."), []);
  assert.deepEqual(lintText("Source: LFPC Art. 56."), []);
});

test("T4 the Zara card says exactly what Zara's row says", () => {
  const zara = RETURN_RULES.find((r) => r.store.startsWith("Zara"))!;
  const p = PIECES.find((x) => x.id === "zara")!;
  assert.equal(p.title, zara.store);
  assert.ok(p.facts[0].value.startsWith(`${zara.windowDays} days`));
  assert.ok(p.facts[1].value.includes("MX$69") && zara.costNote!.includes("MX$69"));
  assert.equal(zara.discountedReturnable, "unknown");
  assert.equal(p.facts[2].tone, "unknown");
  assert.equal(p.source!.checkedAt, zara.checkedAt);
  assert.equal(p.source!.url, zara.sourceUrl);
});

test("T4 the autopsy is labeled fictional and carries the engine's number", () => {
  const p = PIECES.find((x) => x.id === "two-jackets")!;
  assert.equal(p.fictional, true);
  assert.ok(p.facts.some((f) => f.value === "MX$6,565" && f.tone === "risk"));
});

test("T7 store request input: names in, junk out", () => {
  assert.equal(cleanStoreName("  Liverpool  "), "Liverpool");
  assert.equal(cleanStoreName("H&M"), "H&M");
  assert.equal(cleanStoreName("C&A México"), "C&A México");
  assert.equal(cleanStoreName("Levi's"), "Levi's");
  for (const bad of ["", " ", "x", "a".repeat(61), "<script>alert(1)</script>", "https://shein.com", "www.shein.com", "shein.com/mx?x=1", 42, null])
    assert.equal(cleanStoreName(bad), null, String(bad));
});

test("T5 channel tags", () => {
  assert.equal(readSrc("wa"), "wa");
  assert.equal(readSrc("share"), "share");
  assert.equal(readSrc("facebook"), "direct");
  assert.equal(readSrc(null), "direct");
  assert.equal(pieceLink("zara", "wa"), "https://beforeyoupay.xyz/rules?src=wa&p=zara#zara");
});

import { isBusy, BUSY_MESSAGE } from "../lib/busy.ts";
test("T9 rate limits and timeouts are 'busy', never the buyer's screenshot", () => {
  for (const m of [
    'ApiError {"error":{"code":429,"message":"Resource has been exhausted (e.g. check quota).","status":"RESOURCE_EXHAUSTED"}}',
    "TimeoutError The operation was aborted due to timeout",
    'ApiError {"error":{"code":503,"message":"The model is overloaded.","status":"UNAVAILABLE"}}',
  ]) assert.ok(isBusy(m), m);
  assert.ok(!isBusy("SyntaxError Unexpected token in JSON at position 12"));
  assert.match(BUSY_MESSAGE, /free check wasn't used/);
  assert.doesNotMatch(BUSY_MESSAGE, /clearer/);
});
