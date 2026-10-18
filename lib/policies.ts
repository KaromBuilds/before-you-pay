import type { PolicyNote, Returnable } from "./types";

// Curated return-policy notes. Condition 2: every note carries a source, a check date and a status.
// Nothing here is marked "supported" unless it was independently confirmed. Unknown stays unknown.
export const POLICY_NOTES: PolicyNote[] = [
  {
    store: "Cumbre Outdoor (fictional)",
    regularReturnable: "yes",
    discountedReturnable: "no",
    status: "advertised",
    source: "Fictional demo policy written for this prototype",
    checkedAt: "2026-10-18",
    note: "Demo only. 'Items bought with a promotional code are final sale.'",
  },
  {
    store: "The North Face México",
    regularReturnable: "unknown",
    discountedReturnable: "unknown",
    status: "unverified",
    source: "thenorthface.com.mx/politicas-de-devolucion: page rendered only the site header, no policy text",
    checkedAt: "2026-10-15",
    note: "One buyer reports a discounted-item return was refused. Not confirmed from the store's own text.",
  },
];

export function unknownPolicy(store: string | null, today: string): PolicyNote {
  return {
    store: store || "Unknown store",
    regularReturnable: "unknown",
    discountedReturnable: "unknown",
    status: "unverified",
    source: "No policy text found on the screenshot or in our notes",
    checkedAt: today,
    note: "Paste the store's return policy below to check it.",
  };
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export function findPolicy(store: string | null): PolicyNote | null {
  if (!store) return null;
  const s = norm(store);
  for (const p of POLICY_NOTES) {
    const key = norm(p.store.replace(/\(.*\)/, ""));
    const first = key.split(" ").filter((w) => w.length > 2 && w !== "the");
    if (s.includes(key) || (first.length && first.every((w) => s.includes(w)))) return p;
  }
  return null;
}

// Keyword reading of policy text the buyer pastes (or text visible on the screenshot).
// Deliberately conservative: it only says "no" or "yes" on explicit wording; otherwise "unknown".
const NO_DISCOUNTED = [
  /(promoci|descuento|oferta|rebaja|liquidaci|sale|promotional|discount|clearance)[^.]{0,80}(no (se )?(aceptan|aplica|admite|tienen|son)[^.]{0,30}(devoluci|cambio|reembolso)|venta final|final sale|cannot be returned|non.?returnable|not eligible)/,
  /(no (se )?(aceptan|aplica|admite)[^.]{0,30}(devoluci|cambio|reembolso))[^.]{0,80}(promoci|descuento|oferta|rebaja|liquidaci|sale|promotional|discount|clearance)/,
  /(venta final|final sale)/,
];
const NO_ANY = [/no (se )?(aceptan|realizan|hacen) (devoluciones|cambios)/, /no returns/, /all sales (are )?final/];
const YES_ANY = [/(\d{1,2}) (dias|days)[^.]{0,60}(devoluci|cambio|return|refund)/, /(devoluci|return|refund)[^.]{0,60}(\d{1,2}) (dias|days)/];

export function classifyPolicyText(text: string): { regular: Returnable; discounted: Returnable } {
  const t = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (NO_ANY.some((r) => r.test(t))) return { regular: "no", discounted: "no" };
  const discountedNo = NO_DISCOUNTED.some((r) => r.test(t));
  const regularYes = YES_ANY.some((r) => r.test(t));
  return {
    regular: regularYes ? "yes" : "unknown",
    discounted: discountedNo ? "no" : "unknown",
  };
}
