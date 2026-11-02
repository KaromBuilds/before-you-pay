// The Step-5 engine: turns what the buyer already has (a checkout screenshot, read into fields)
// into the pesos she would lose if the size fails, under that store's real return rule.
// Team 8 Condition 1: the AI only reads; this deterministic code decides what is shown.
import type { Extraction, Flag, Item, ItemRisk, Result, ReturnRule } from "./types";

export const mxn = (n: number) => "MX$" + Math.round(n).toLocaleString("en-US");

/** Words the product must never say (Charter principle 2: no false certainty). */
export const BANNED = /\b(safe|will fit|guaranteed|risk[- ]free|no risk)\b/i;

export function lineTotal(i: Item): number | null {
  return i.paidPrice == null ? null : i.paidPrice * Math.max(1, i.qty);
}

export function isDiscounted(i: Item, codes: string[]): boolean {
  if (i.listPrice != null && i.paidPrice != null && i.paidPrice < i.listPrice) return true;
  return codes.length > 0;
}

const words = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
function similar(a: Item, b: Item): boolean {
  if (a.category !== b.category) return false;
  if (a.name.trim().toLowerCase() === b.name.trim().toLowerCase()) return true;
  const wa = words(a.name);
  return [...words(b.name)].filter((w) => wa.has(w)).length >= 2;
}

const ruleLabel = (r: ReturnRule) => r.store.replace(/\s*\(fictional\)/, "");

export function analyze(ex: Extraction, rule: ReturnRule): Result {
  const flags: Flag[] = [];

  // Amount paid
  const lines = ex.items.map(lineTotal);
  let amountPaid: number | null = null;
  let amountPaidSource: Result["amountPaidSource"] = "unknown";
  if (ex.total != null) {
    amountPaid = ex.total;
    amountPaidSource = "total on screenshot";
  } else if (lines.length && lines.every((x) => x != null)) {
    amountPaid = (lines as number[]).reduce((a, b) => a + b, 0) + (ex.shipping ?? 0);
    amountPaidSource = "sum of items";
  }

  // Money at risk per item
  const perItem: ItemRisk[] = ex.items.map((it) => {
    const discounted = isDiscounted(it, ex.discountCodes);
    return {
      itemId: it.id,
      amount: lineTotal(it) ?? 0,
      discounted,
      returnable: discounted ? rule.discountedReturnable : rule.regularReturnable,
    };
  });
  const finalSale = perItem.filter((p) => p.returnable === "no").reduce((a, p) => a + p.amount, 0);
  const notConfirmed = perItem.filter((p) => p.returnable === "unknown").reduce((a, p) => a + p.amount, 0);
  const store = ruleLabel(rule);

  // 1. Final sale
  if (finalSale > 0) {
    const n = perItem.filter((p) => p.returnable === "no").length;
    flags.push({
      id: "final-sale",
      level: "high",
      title: `${mxn(finalSale)} is final sale`,
      detail: `${store}'s own words say ${n === 1 ? "this item can't" : `these ${n} items can't`} be returned. If the size fails, you keep ${n === 1 ? "it" : "them"}.`,
      nextStep: "Compare the store's size chart in centimeters with a garment you own before paying.",
    });
  }

  // 2. Return not confirmed (unknown stays unknown)
  if (notConfirmed > 0) {
    const anyDiscounted = perItem.some((p) => p.returnable === "unknown" && p.discounted);
    flags.push({
      id: "not-confirmed",
      level: "high",
      title: `Return not confirmed for ${mxn(notConfirmed)}`,
      detail: anyDiscounted
        ? `We couldn't find ${store}'s rule for discounted items, so this money counts as at risk, not protected.`
        : `We couldn't find ${store}'s return rule, so this money counts as at risk, not protected.`,
      nextStep: rule.sourceUrl
        ? `Open ${store}'s return page and search for "rebaja", "promoción" or "descuento" before paying.`
        : `Find ${store}'s return policy and paste it below before paying.`,
    });
  }

  // 3. Size not visible
  for (const it of ex.items) {
    if ((it.category === "apparel" || it.category === "footwear" || it.category === "accessory") && !it.size.trim()) {
      flags.push({
        id: `no-size-${it.id}`,
        level: "high",
        title: `No size visible for "${it.name}"`,
        detail: "The checkout doesn't show which size you picked.",
        nextStep: "Go back to the cart and confirm the size before paying.",
      });
    }
  }

  // 4. Duplicates / several units
  // Bug fix (Week 12 test pass): "Hooded Thermal Puffer Jacket" + "Thermal Puffer Jacket" was reported as
  // '"Hooded Thermal Puffer Jacket" appears twice'. Only identical names are "twice"; similar ones are named as a pair.
  const dupes: string[] = [];
  for (let i = 0; i < ex.items.length; i++)
    for (let j = i + 1; j < ex.items.length; j++) {
      const a = ex.items[i], b = ex.items[j];
      if (!similar(a, b)) continue;
      dupes.push(a.name.trim().toLowerCase() === b.name.trim().toLowerCase() ? `"${a.name}" appears twice` : `"${a.name}" and "${b.name}" are very similar`);
    }
  const multi = ex.items.filter((i) => i.qty > 1);
  if (dupes.length || multi.length) {
    flags.push({
      id: "duplicates",
      level: "medium",
      title: "Same or very similar items",
      detail: [...new Set(dupes)].concat(multi.map((i) => `${i.qty} × "${i.name}"`)).join("; ") + ". If the size is wrong, it's wrong for all of them.",
      nextStep: "Buy one, check the fit at home, then buy the rest.",
    });
  }

  // 5. Pressure on the checkout (pressure flags)
  if (ex.pressureCues.length) {
    flags.push({
      id: "pressure",
      level: "medium",
      title: "Pressure on this checkout",
      detail: `The screen says ${ex.pressureCues.map((c) => `"${c}"`).join(", ")}. Urgency is designed to make you skip checks.`,
      nextStep: "Close the tab for 10 minutes. A real need will still be there.",
    });
  }
  if (ex.discountCodes.length) {
    flags.push({
      id: "code",
      level: "medium",
      title: `Discount code: ${ex.discountCodes.join(", ")}`,
      detail: "A code can quietly change the return rule. The discount is what pushes the purchase, and it can also be what removes the return.",
      nextStep: `Search the code's terms for "venta final" or "no aplica devolución".`,
    });
  }

  // 6. Return cost (info)
  if (rule.costNote && perItem.some((p) => p.returnable === "yes")) {
    flags.push({
      id: "return-cost",
      level: "info",
      title: rule.windowDays ? `Returns: ${rule.windowDays} days, with conditions` : "Returns have conditions",
      detail: rule.costNote,
      nextStep: "Keep the tags on and the order email until you've tried everything on.",
    });
  }

  const order = { high: 0, medium: 1, info: 2 } as const;
  flags.sort((a, b) => order[a.level] - order[b.level]);

  const nextStep =
    flags[0]?.nextStep ??
    "The store advertises returns for every item here. Keep the tags on until you've tried everything on.";

  return {
    amountPaid,
    amountPaidSource,
    moneyAtRisk: finalSale + notConfirmed,
    finalSale,
    notConfirmed,
    perItem,
    flags,
    nextStep,
    rule,
  };
}
