// Week 15 · The rule desk: distribution content made by the product's own method.
// Every piece is data. The rule card reads its facts from RETURN_RULES (the same table the checker uses), the cart
// autopsy reads them from the engine run on the FICTIONAL sample, and every piece must pass lintPiece() before it ships
// (tests/content.test.ts). Team 5 Week 15 Condition 4 (shadow clause): no manufactured confidence, no pressure,
// no misleading return guarantee.
import { RETURN_RULES } from "./policies.ts";
import { analyze, BANNED, mxn } from "./engine.ts";
import { DEMO_EXTRACTION } from "./demo.ts";
import type { ReturnRule } from "./types";

export type SeriesId = "store" | "autopsy" | "five-days";
export type Tone = "ok" | "unknown" | "risk" | "plain";
export type Format = "image" | "video" | "text";

export const SERIES: { id: SeriesId; tag: string; blurb: string }[] = [
  { id: "store", tag: "What the store says", blurb: "A store's return rule in its own words, with the day we read it and the link." },
  // Persona-test fix (Diego): the regret comes before the next cart, so "Your five days" now sits right after the stores.
  { id: "five-days", tag: "Your five days", blurb: "What Mexican law gives you after delivery, and how to use it calmly." },
  { id: "autopsy", tag: "Cart autopsy", blurb: "A fictional cart taken apart by the same engine you can run on your own." },
];

export interface Piece {
  id: string; // also the URL anchor and the ?p= value
  series: SeriesId;
  status: "finished" | "sketch";
  format: Format;
  title: string;
  fictional?: boolean;
  facts: { label: string; value: string; tone: Tone }[];
  body?: string; // the exact copy-ready text of a message piece
  nextStep: string;
  source: { label: string; url: string | null; checkedAt: string } | null;
  asset?: string;
  alt?: string;
}

const rule = (prefix: string): ReturnRule => {
  const r = RETURN_RULES.find((x) => x.store.startsWith(prefix));
  if (!r) throw new Error(`No rule for ${prefix}`);
  return r;
};

const discountedFact = (r: ReturnRule) =>
  r.discountedReturnable === "unknown"
    ? { label: "Discounted items", value: "The page doesn't say, so we count them as risk", tone: "unknown" as Tone }
    : r.discountedReturnable === "no"
      ? { label: "Discounted items", value: "Final sale, in the store's own words", tone: "risk" as Tone }
      : { label: "Discounted items", value: "Returnable, in the store's own words", tone: "ok" as Tone };

/** S1 · a store's rule, built only from its row in RETURN_RULES. */
export function storePiece(id: string, prefix: string, windowFrom: string, how: string, status: Piece["status"]): Piece {
  const r = rule(prefix);
  return {
    id,
    series: "store",
    status,
    format: "image",
    title: r.store,
    facts: [
      {
        label: "Full-price items",
        value: r.regularReturnable === "yes" && r.windowDays ? `${r.windowDays} days ${windowFrom}` : "The page doesn't say",
        tone: r.regularReturnable === "yes" ? "ok" : "unknown",
      },
      { label: "How to return", value: how, tone: "plain" },
      discountedFact(r),
    ],
    nextStep: "Before paying for a sale item, check your cart.",
    source: { label: r.source, url: r.sourceUrl, checkedAt: r.checkedAt },
    asset: status === "finished" ? `/rules/${id}-card.png` : undefined,
    alt: `${r.store} return rule card`,
  };
}

/** S2 · the engine's real output on the fictional sample cart. */
export function autopsyPiece(): Piece {
  const cumbre = rule("Cumbre");
  const r = analyze(DEMO_EXTRACTION, cumbre);
  const items = DEMO_EXTRACTION.items;
  const code = DEMO_EXTRACTION.discountCodes[0];
  return {
    id: "two-jackets",
    series: "autopsy",
    status: "finished",
    format: "video",
    fictional: true,
    title: "Two jackets, one code",
    facts: [
      { label: "The cart", value: `${items.length} similar jackets, both size ${items[0].size}, code ${code}, ${mxn(r.amountPaid ?? 0)}`, tone: "plain" },
      { label: "The store's own words", value: "Items bought with a promotional code are final sale", tone: "risk" },
      { label: "At risk if the size fails", value: mxn(r.moneyAtRisk), tone: "risk" },
      { label: "What the screen does", value: `Shows “${DEMO_EXTRACTION.pressureCues[0]}” next to the pay button`, tone: "plain" },
    ],
    nextStep: r.flags[0]?.nextStep ?? "Check the size chart in centimeters before paying.",
    source: { label: "Fictional cart and store, read by the Before You Pay engine", url: null, checkedAt: "2026-11-22" },
    asset: "/rules/two-jackets.mp4",
    alt: "Vertical video: a fictional cart taken apart step by step",
  };
}

export const FIVE_DAYS_TEXT = [
  "It arrived too big?",
  "In Mexico, an online purchase only becomes final five business days after delivery (Federal Consumer Protection Law, Art. 56). Inside that window you can revoke the purchase, and the store has to give back the price you paid. Return shipping and insurance are on you.",
  "What to do: tell the store in writing (email or the app's chat) inside the five days, keep the screenshot, and send the item back unused with its tags.",
  "What we can't promise: that the store will agree. If it refuses, you can file a complaint with Profeco.",
  "Before your next cart: beforeyoupay.xyz/rules",
  "Source: LFPC Art. 56 and Profeco's guide to buying online. Checked Nov 22, 2026.",
].join("\n\n");

export const PIECES: Piece[] = [
  storePiece("zara", "Zara", "from the shipping date", "Free in a Zara store · MX$69 at a drop-off point, taken from your refund", "finished"),
  storePiece("palacio", "El Palacio de Hierro", "after delivery", "Call for a return folio · courier or some Palacio stores", "sketch"),
  autopsyPiece(),
  {
    id: "two-sizes",
    series: "autopsy",
    status: "sketch",
    format: "video",
    fictional: true,
    title: "Same item, two sizes",
    facts: [
      { label: "The plan", value: "Buy M and L, return the one that doesn't fit", tone: "plain" },
      { label: "The catch", value: "With a code, both can be final sale", tone: "risk" },
    ],
    nextStep: "Buy one size, check the fit at home, then buy the rest.",
    source: { label: "Fictional cart (sketch)", url: null, checkedAt: "2026-11-22" },
  },
  {
    id: "five-days",
    series: "five-days",
    status: "finished",
    format: "text",
    title: "It arrived too big",
    facts: [
      { label: "Window", value: "5 business days after delivery", tone: "plain" },
      { label: "What the law says", value: "You can revoke; the law says the store returns the price paid", tone: "plain" },
      { label: "On you", value: "Return shipping and insurance", tone: "unknown" },
    ],
    body: FIVE_DAYS_TEXT,
    nextStep: "Tell the store in writing inside the five days and keep the screenshot.",
    source: { label: "LFPC Art. 56 · Profeco, buying online", url: "https://mley.mx/LFPC/articulo/56/", checkedAt: "2026-11-22" },
  },
  {
    id: "counting-days",
    series: "five-days",
    status: "sketch",
    format: "text",
    title: "Counting the five business days",
    facts: [
      { label: "Delivered on a Thursday", value: "The window ends the next Thursday", tone: "plain" },
      { label: "Not counted", value: "Saturdays, Sundays and holidays", tone: "plain" },
    ],
    nextStep: "Write the last day on the delivery box the day it arrives.",
    source: { label: "LFPC Art. 56 (sketch)", url: "https://mley.mx/LFPC/articulo/56/", checkedAt: "2026-11-22" },
  },
];

export const pieceById = (id: string | null | undefined) => PIECES.find((p) => p.id === id) ?? null;
export const finished = () => PIECES.filter((p) => p.status === "finished");

// ---- The lint: voice rules 1–3 in code ----------------------------------------------------------------------

// Quoting a checkout's pressure to NAME it is allowed; using it in our own voice is not. Quoted text is skipped.
const unquote = (t: string) => t.replace(/“[^”]*”/g, " ").replace(/"[^"]*"/g, " ");
const ACRONYMS = new Set(["LFPC", "PROFECO", "MXN"]);

const PRESSURE: [RegExp, string][] = [
  [/!/, "exclamation mark"],
  [/\b(only|just) (today|tonight|now|\d+ left)\b/i, "“only today / only N left”"],
  [/\blast (chance|units?|pieces?|day to buy)\b/i, "“last chance / last units”"],
  [/\b(hurry|act now|don'?t miss|before it'?s too late|limited time|today only|ends (today|tonight|soon|in))\b/i, "urgency phrase"],
  [/\b\d{1,2}:\d{2}:\d{2}\b/, "countdown"],
  [/[⚠🚨‼⏰🔥]/u, "alarm emoji"],
];
const PROMISES: [RegExp, string][] = [
  [BANNED, "banned word (safe · will fit · guaranteed · risk-free · no risk)"],
  [/\byou can (return|send back) (it|them|this)\b/i, "“you can return it”"],
  [/\b(you|we)('ll| will) (get|give) (you )?(your )?money back\b/i, "“you'll get your money back”"],
  [/\bwe('ll| will) save you\b/i, "“we'll save you money”"],
  [/\b100 ?%/, "“100%”"],
];

export function lintText(text: string): string[] {
  const t = unquote(text);
  const out: string[] = [];
  for (const [re, why] of [...PRESSURE, ...PROMISES]) if (re.test(t)) out.push(why);
  const caps = (t.match(/\b[A-Z]{4,}\b/g) ?? []).filter((w) => !ACRONYMS.has(w));
  if (caps.length) out.push(`ALL-CAPS word (${caps[0]})`);
  return out;
}

const DAY = 86_400_000;
/** Voice rule 1 + the lint. Returns the problems; an empty list means the piece may ship. */
export function lintPiece(p: Piece, today: string): string[] {
  const text = [p.title, ...p.facts.flatMap((f) => [f.label, f.value]), p.body ?? "", p.nextStep].join("\n");
  const out = lintText(text);
  if (p.status === "finished") {
    if (!p.source) out.push("no source");
    else {
      const age = (Date.parse(today) - Date.parse(p.source.checkedAt)) / DAY;
      if (!(age >= 0 && age <= 30)) out.push(`check date ${p.source.checkedAt} is not within 30 days of ${today}`);
    }
    if (!p.nextStep.trim()) out.push("no next step");
  }
  return out;
}

// ---- Next action: "Ask for your store's rule" (store name only) ----------------------------------------------

/** Security floor #4: a store name, 2–60 characters, letters/numbers/space & . ' - only, no links. Same rule in SQL. */
export function cleanStoreName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.replace(/\s+/g, " ").trim();
  if (s.length < 2 || s.length > 60) return null;
  if (/(https?|www\.)/i.test(s)) return null;
  if (!/^[\p{L}\p{N} &.'’-]+$/u.test(s)) return null;
  return s;
}

export type Src = "wa" | "share" | "direct";
export const readSrc = (v: string | null | undefined): Src => (v === "wa" || v === "share" ? v : "direct");
export const pieceLink = (id: string, src: Src) => `https://beforeyoupay.xyz/rules?src=${src}&p=${id}#${id}`;
