import type { ReturnRule, Returnable } from "./types";

// Curated return rules. Charter principle 2: every rule carries its source and check date.
// "advertised" = the store's own published words. Anything the store's page does not say stays "unknown".
export const RETURN_RULES: ReturnRule[] = [
  {
    store: "Zara México",
    aliases: ["zara"],
    regularReturnable: "yes",
    discountedReturnable: "unknown",
    windowDays: 30,
    costNote: "Free in a Zara store; MX$69 per request at a drop-off point, deducted from the refund.",
    status: "advertised",
    source: "zara.com/mx · Help center: How to return",
    sourceUrl: "https://www.zara.com/mx/es/help-center/HowToReturn",
    checkedAt: "2026-11-01",
    note: "30 days from the shipping date, items in original condition with all tags. The page does not say whether discounted items can be returned; it points to separate 'special return conditions'.",
  },
  {
    store: "The North Face México",
    aliases: ["the north face", "north face", "tnf"],
    regularReturnable: "unknown",
    discountedReturnable: "unknown",
    windowDays: null,
    costNote: null,
    status: "unverified",
    source: "thenorthface.com.mx return-policy page rendered no policy text when checked",
    sourceUrl: null,
    checkedAt: "2026-10-15",
    note: "One buyer reports a discounted-item return was refused. Not confirmed from the store's own text.",
  },
  {
    store: "Cumbre Outdoor (fictional)",
    aliases: ["cumbre"],
    regularReturnable: "yes",
    discountedReturnable: "no",
    windowDays: 15,
    costNote: null,
    status: "advertised",
    source: "Fictional demo policy written for this prototype",
    sourceUrl: null,
    checkedAt: "2026-11-01",
    note: "Demo only: 'Items bought with a promotional code are final sale.'",
  },
];

export function unknownRule(store: string | null, today: string): ReturnRule {
  return {
    store: store || "Unknown store",
    regularReturnable: "unknown",
    discountedReturnable: "unknown",
    windowDays: null,
    costNote: null,
    status: "unverified",
    source: "No return rule found on the screenshot or in our table",
    sourceUrl: null,
    checkedAt: today,
    note: "Paste the store's return policy below and we'll read it.",
  };
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function findRule(store: string | null): ReturnRule | null {
  if (!store) return null;
  const s = ` ${norm(store)} `;
  for (const r of RETURN_RULES) {
    const keys = [r.store.replace(/\(.*\)/, ""), ...(r.aliases ?? [])].map(norm).filter(Boolean);
    if (keys.some((k) => s.includes(` ${k} `) || s.includes(` ${k}`))) return r;
  }
  return null;
}

// Conservative keyword reading of policy text: says "no"/"yes" only on explicit wording, otherwise "unknown".
const NO_DISCOUNTED = [
  /(promoci|descuento|oferta|rebaja|liquidaci|sale|promotional|discount|clearance)[^.]{0,80}(no (se )?(aceptan|aplica|admite|tienen|son)[^.]{0,30}(devoluci|cambio|reembolso)|venta final|final sale|cannot be returned|non.?returnable|not eligible)/,
  /(no (se )?(aceptan|aplica|admite)[^.]{0,30}(devoluci|cambio|reembolso))[^.]{0,80}(promoci|descuento|oferta|rebaja|liquidaci|sale|promotional|discount|clearance)/,
  /(venta final|final sale)/,
];
const NO_ANY = [/no (se )?(aceptan|realizan|hacen) (devoluciones|cambios)/, /no returns/, /all sales (are )?final/];
const YES_ANY = [/(\d{1,2}) (dias|days)[^.]{0,60}(devoluci|cambio|return|refund)/, /(devoluci|return|refund)[^.]{0,60}(\d{1,2}) (dias|days)/];

export function classifyPolicyText(text: string): { regular: Returnable; discounted: Returnable } {
  const t = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Bug fix (Week 12): "Los artículos en promoción no aceptan devoluciones" was read as "no returns at all".
  // A no-returns sentence only counts as store-wide when it doesn't mention discounts.
  const DISC = /(promoci|descuento|oferta|rebaja|liquidaci|sale\b|promotional|discount|clearance)/;
  const sentences = t.split(/[.\n;]+/);
  if (sentences.some((s) => NO_ANY.some((r) => r.test(s)) && !DISC.test(s))) return { regular: "no", discounted: "no" };
  return {
    regular: YES_ANY.some((r) => r.test(t)) ? "yes" : "unknown",
    discounted: NO_DISCOUNTED.some((r) => r.test(t)) ? "no" : "unknown",
  };
}

/** Pick the rule for a check: text the buyer pasted > wording visible on the screenshot > curated table > unknown. */
export function resolveRule(store: string | null, visibleTerms: string | null, pasted: string | null, today: string): ReturnRule {
  const fromText = (text: string, source: string): ReturnRule | null => {
    const c = classifyPolicyText(text);
    if (c.regular === "unknown" && c.discounted === "unknown") return null;
    const base = findRule(store);
    return {
      store: store || "This store",
      regularReturnable: c.regular !== "unknown" ? c.regular : base?.regularReturnable ?? "unknown",
      discountedReturnable: c.discounted !== "unknown" ? c.discounted : base?.discountedReturnable ?? "unknown",
      windowDays: base?.windowDays ?? null,
      costNote: base?.costNote ?? null,
      status: "advertised",
      source,
      sourceUrl: null,
      checkedAt: today,
      note: `"${text.slice(0, 160)}${text.length > 160 ? "…" : ""}"`,
    };
  };
  if (pasted && pasted.trim().length >= 15) {
    const r = fromText(pasted.trim().slice(0, 3000), "Policy text you pasted (keyword reading; read it yourself too)");
    if (r) return r;
  }
  if (visibleTerms) {
    const r = fromText(visibleTerms, "Return wording visible on your screenshot (keyword reading)");
    if (r) return r;
  }
  return findRule(store) ?? unknownRule(store, today);
}
