import type { Extraction, Item } from "./types";

// Week 13 fix #1 (from real users): "no me dejó subir múltiples fotos entonces no enfoqué todo el carrito."
// Several screenshots of ONE cart are read one by one and merged into a single check.
// Overlap rule: when the same line (name + size + price) appears in two different screenshots, it is the same
// line seen twice while scrolling, so it is kept once. Repeats inside one screenshot are real and kept.
// Bug found in the live test (Nov 8): the reader returned "M" on one screenshot and "Talla M" on the next,
// so the overlapping dress was counted twice. Sizes and names are normalized before comparing.
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(talla|size|tamano)\b/g, "").replace(/[^a-z0-9]/g, "");
const key = (i: Item) => `${norm(i.name)}|${norm(i.size)}|${i.paidPrice ?? ""}`;

export function mergeExtractions(parts: Extraction[]): Extraction {
  if (parts.length === 0) throw new Error("nothing to merge");
  if (parts.length === 1) return parts[0];
  const items: Item[] = [];
  const seenBefore = new Set<string>();
  for (const p of parts) {
    const here = new Set<string>();
    for (const it of p.items) {
      const k = key(it);
      if (seenBefore.has(k)) continue; // overlap with an earlier screenshot
      here.add(k);
      items.push({ ...it, id: `m${items.length + 1}` });
    }
    here.forEach((k) => seenBefore.add(k));
  }
  const firstNum = (f: (e: Extraction) => number | null) => {
    const vals = parts.map(f).filter((v): v is number => v != null);
    return vals.length ? Math.max(...vals) : null; // the cart total is the largest total any screenshot shows
  };
  const uniq = (xs: string[]) => [...new Set(xs)];
  const terms = uniq(parts.map((p) => p.returnTermsVisible).filter((t): t is string => !!t)).join(" ");
  return {
    store: parts.find((p) => p.store)?.store ?? null,
    items: items.slice(0, 20),
    discountCodes: uniq(parts.flatMap((p) => p.discountCodes)).slice(0, 5),
    shipping: firstNum((e) => e.shipping),
    total: firstNum((e) => e.total),
    returnTermsVisible: terms ? terms.slice(0, 1500) : null,
    pressureCues: uniq(parts.flatMap((p) => p.pressureCues)).slice(0, 6),
    source: parts.every((p) => p.source === "simulated") ? "simulated" : "screenshot",
    checkedAt: parts[0].checkedAt,
  };
}
