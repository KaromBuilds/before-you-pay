import type { Analysis, Extraction, FitRecord, Item, ItemExposure, PolicyNote, Reference, Warning } from "./types";

export const mxn = (n: number) => "MX$" + Math.round(n).toLocaleString("en-US");

const normBrand = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const normSize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export function lineTotal(i: Item): number | null {
  if (i.paidPrice == null) return null;
  return i.paidPrice * Math.max(1, i.qty);
}

export function isDiscounted(i: Item, codes: string[]): boolean {
  if (i.listPrice != null && i.paidPrice != null && i.paidPrice < i.listPrice) return true;
  return codes.length > 0;
}

function fitWarnings(item: Item, memory: FitRecord[], ref: Reference): Warning[] {
  const w: Warning[] = [];
  const label = item.name || "This item";

  if (item.category === "accessory") {
    const letter = /^(XXS|XS|S|M|L|XL|XXL|CH|G|EG|U|UNI)$/i.test(normSize(item.size));
    if (!item.size) {
      w.push({ itemId: item.id, level: "high", title: `${label}: size not visible`, detail: "Check the size before paying." });
    } else if (letter && item.sizeHasCm !== true) {
      w.push({
        itemId: item.id,
        level: "high",
        title: `${label}: sized "${item.size}" with no centimeters`,
        detail:
          ref.wristCm != null
            ? `Your wrist measures ${ref.wristCm} cm. Ask the store how many centimeters "${item.size}" is before paying.`
            : 'Letter sizes for accessories change between brands. Measure your wrist with a paper strip and ask the store for the centimeters.',
      });
    }
    return w;
  }

  if (item.category !== "apparel" && item.category !== "footwear") return w;

  if (!item.size) {
    w.push({ itemId: item.id, level: "high", title: `${label}: size not visible`, detail: "We couldn't read a size. Check it before paying." });
    return w;
  }

  const brand = normBrand(item.brand);
  const size = normSize(item.size);
  const history = brand ? memory.filter((r) => normBrand(r.brand) === brand && r.category === item.category) : [];
  const sameSize = history.filter((r) => normSize(r.size) === size);

  const bad = sameSize.find((r) => r.outcome !== "fit");
  const good = sameSize.find((r) => r.outcome === "fit");
  if (bad) {
    w.push({
      itemId: item.id,
      level: "high",
      title: `${label}: ${item.size} was ${bad.outcome === "too_big" ? "too big" : "too small"} for you in ${item.brand} before`,
      detail: `Your fit memory says ${item.brand} ${item.size} didn't fit. Consider ${bad.outcome === "too_big" ? "a smaller" : "a larger"} size and check the size chart. This is a warning, not a guarantee.`,
    });
  } else if (good) {
    w.push({
      itemId: item.id,
      level: "low",
      title: `${label}: ${item.size} fit you in ${item.brand} before`,
      detail: "Same brand, same size in your fit memory. Cuts can still change between product lines, so this is not a guarantee.",
    });
  } else if (history.length) {
    const fits = history.filter((r) => r.outcome === "fit").map((r) => r.size);
    w.push({
      itemId: item.id,
      level: "medium",
      title: `${label}: you're choosing ${item.size} in ${item.brand}`,
      detail: fits.length
        ? `Your fit memory says ${fits.join(", ")} fit you in this brand, not ${item.size}.`
        : `You have ${item.brand} records, but none in ${item.size} that fit.`,
    });
  } else {
    const refText =
      ref.chestCm != null || ref.lengthCm != null
        ? `Compare your reference garment (chest ${ref.chestCm ?? "?"} cm, length ${ref.lengthCm ?? "?"} cm) with this store's size chart.`
        : "Measure one garment that fits you well (chest width and length) and compare it with this store's size chart.";
    w.push({
      itemId: item.id,
      level: "medium",
      title: `${label}: no fit evidence for ${item.brand || "this brand"}`,
      detail: `Sizes change between brands. ${refText}`,
    });
  }
  return w;
}

function similar(a: Item, b: Item): boolean {
  if (a.category !== b.category) return false;
  if (normBrand(a.brand) && normBrand(a.brand) === normBrand(b.brand)) return true;
  const wa = new Set(a.name.toLowerCase().split(/\W+/).filter((x) => x.length > 3));
  const shared = b.name.toLowerCase().split(/\W+/).filter((x) => x.length > 3 && wa.has(x));
  return shared.length >= 2;
}

export function analyze(ex: Extraction, memory: FitRecord[], ref: Reference, policy: PolicyNote): Analysis {
  const warnings: Warning[] = [];
  const reasons: string[] = [];

  // ---- Amount paid (Condition 3: separate what you pay from what is at risk)
  const lines = ex.items.map(lineTotal);
  const allKnown = lines.length > 0 && lines.every((x) => x != null);
  let amountPaid: number | null = null;
  let amountPaidSource: Analysis["amountPaidSource"] = "unknown";
  if (ex.total != null) {
    amountPaid = ex.total;
    amountPaidSource = "total on screenshot";
  } else if (allKnown) {
    amountPaid = (lines as number[]).reduce((a, b) => a + b, 0) + (ex.shipping ?? 0);
    amountPaidSource = "sum of items";
  }

  // ---- Conditional exposure per item
  const perItem: ItemExposure[] = [];
  let confirmed = 0;
  let unconfirmed = 0;
  for (const it of ex.items) {
    const amount = lineTotal(it) ?? 0;
    const discounted = isDiscounted(it, ex.discountCodes);
    const returnable = discounted ? policy.discountedReturnable : policy.regularReturnable;
    perItem.push({ itemId: it.id, amount, discounted, returnable });
    if (returnable === "no") confirmed += amount;
    else if (returnable === "unknown") unconfirmed += amount;
  }

  // ---- Fit warnings
  for (const it of ex.items) warnings.push(...fitWarnings(it, memory, ref));

  // ---- Cart-level flags
  const dupes: string[] = [];
  for (let i = 0; i < ex.items.length; i++)
    for (let j = i + 1; j < ex.items.length; j++)
      if (similar(ex.items[i], ex.items[j])) dupes.push(`${ex.items[i].name} + ${ex.items[j].name}`);
  const multiQty = ex.items.filter((i) => i.qty > 1);
  if (dupes.length || multiQty.length) {
    warnings.push({
      itemId: null,
      level: "medium",
      title: "Similar items in the same cart",
      detail: [...dupes, ...multiQty.map((i) => `${i.qty} × ${i.name}`)].join("; ") + ". Do you need all of them?",
    });
    reasons.push("You're buying similar items at once. If the size is wrong, it's wrong for all of them.");
  }

  const discountedAtRisk = perItem.filter((p) => p.discounted && p.returnable !== "yes");
  if (discountedAtRisk.length) {
    const sum = discountedAtRisk.reduce((a, p) => a + p.amount, 0);
    const confirmedNo = discountedAtRisk.every((p) => p.returnable === "no");
    warnings.push({
      itemId: null,
      level: "high",
      title: confirmedNo ? "Discounted items here can't be returned" : "The discount may remove your return option",
      detail: confirmedNo
        ? `The store policy says discounted items are final sale. ${mxn(sum)} would be stuck if the size fails.`
        : `We could not confirm that discounted items can be returned. Treat ${mxn(sum)} as unprotected until you read the store's own policy.`,
    });
    reasons.push(
      confirmedNo
        ? `${mxn(sum)} of this cart is final sale. A wrong size means keeping it.`
        : `Returns for ${mxn(sum)} of discounted items are not confirmed.`
    );
  }

  if (ex.pressureCues.length) {
    warnings.push({
      itemId: null,
      level: "medium",
      title: "Sales pressure on this screen",
      detail: `The checkout shows: ${ex.pressureCues.map((c) => `"${c}"`).join(", ")}. Urgency is designed to make you skip checks.`,
    });
    reasons.push("The page is using urgency. A real need will still be there after you check the size.");
  }

  const highFit = warnings.filter((w) => w.itemId && w.level === "high");
  if (highFit.length) reasons.push(`${highFit.length} item(s) have a high fit risk based on your own evidence.`);
  const noEvidence = warnings.filter((w) => w.itemId && w.title.includes("no fit evidence"));
  if (noEvidence.length) reasons.push(`${noEvidence.length} item(s) are in a brand you have no fit evidence for.`);

  return {
    amountPaid,
    amountPaidSource,
    confirmedNonReturnable: confirmed,
    unconfirmed,
    conditionalExposure: confirmed + unconfirmed,
    perItem,
    warnings,
    reasonsToWait: reasons,
    policy,
  };
}
