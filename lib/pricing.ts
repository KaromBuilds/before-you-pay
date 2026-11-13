// Week 14 · Pricing. ONE source of truth for the /pricing page, the /simulator and the 10:1 memo on /about,
// so the three can never disagree (Week 14 clarification: same assumptions everywhere).
// Every number carries a tag: M = measured by us, S = sourced from a public source, A = assumed.
// Team 5 Condition 3: the 10:1 is a hypothesis until real baselines are measured; proxies are labeled as proxies.

export type Tag = "M" | "S" | "A";
export const TAG_LABEL: Record<Tag, string> = { M: "measured", S: "sourced", A: "assumed" };

export interface Fact {
  value: number;
  label: string;
  unit: "MXN" | "%" | "x" | "count" | "USD" | "hours" | "days" | "MXN/USD";
  tag: Tag;
  source: string;
}

/** Switch for the free limit. false = every check stays free (pilot off). */
export const FREE_LIMIT_ON = true;

export const F = {
  pSizeFails: {
    value: 0.24, label: "Chance a guessed size fails", unit: "%", tag: "A",
    source: "Proxy: US online apparel returns run 23–25%, and fit/size drive 53–70% of them (Loop, Coresight via EightX). Not measured in Mexico.",
  },
  hotFashionOrder: {
    value: 989, label: "Average order, Hot Fashion 2026 (Mexico)", unit: "MXN", tag: "S",
    source: "AMVO Hot Fashion 2026 results, via The Logistics World (Sep 2, 2026).",
  },
  fashionOrder: {
    value: 1286, label: "Average online fashion order (Mexico)", unit: "MXN", tag: "S",
    source: "AMVO data via Tiendanube (Emprendedor.com).",
  },
  purchasesAvg: {
    value: 6.5, label: "Online fashion purchases a year, average buyer", unit: "count", tag: "S",
    source: "AMVO via Emprendedor.com (about one every two months).",
  },
  purchasesHeavy: {
    value: 30, label: "Online clothing purchases a year, heavy buyer (the founder)", unit: "count", tag: "M",
    source: "Self-reported by the founder, Nov 10, 2026. One person, founder bias.",
  },
  w13Cart: {
    value: 4997, label: "Money at risk on a real Week 13 cart (Zara app)", unit: "MXN", tag: "M",
    source: "Week 13 user session 2, read live on beforeyoupay.xyz (docs/w13/USERS_W13.md).",
  },
  founderLoss: {
    value: 6565, label: "The founder's own loss: two discounted jackets, no return", unit: "MXN", tag: "M",
    source: "Founder's purchase that started the venture.",
  },
  zaraDropOff: {
    value: 69, label: "Zara México return at a drop-off point (in store: free)", unit: "MXN", tag: "S",
    source: "Zara México returns page, checked Nov 5, 2026.",
  },
  art56Days: {
    value: 5, label: "Legal window to revoke an online purchase in Mexico (buyer pays freight)", unit: "days", tag: "S",
    source: "Ley Federal de Protección al Consumidor, Art. 56, per Profeco (5 business days).",
  },
  mpPct: {
    value: 0.0349, label: "Mercado Pago Link de pago, % per sale (instant)", unit: "%", tag: "S",
    source: "Published rate 3.49% + MX$4 + IVA (Shopify / Calcforlife, 2026). Only at scale; the pilot is paid by bank transfer.",
  },
  mpFixed: { value: 4, label: "Mercado Pago fixed fee per sale", unit: "MXN", tag: "S", source: "Same as above." },
  iva: { value: 0.16, label: "IVA on the processor's fee", unit: "%", tag: "S", source: "16% IVA, charged on the fee, not on the sale." },
  aiUsdPerScreenshot: {
    value: 0.0029, label: "AI read, cost per screenshot", unit: "USD", tag: "A",
    source: "Estimate: ~3K tokens in, ~0.8K out at gemini-3.5-flash-lite list prices (US$0.30 / US$2.50 per 1M).",
  },
  usdMxn: { value: 18.57, label: "Exchange rate", unit: "MXN/USD", tag: "S", source: "Banxico rate published Nov 10, 2026 (18.59) / market average 18.57." },
  screenshotsPerCheck: { value: 2, label: "Screenshots per check (1 to 4)", unit: "count", tag: "A", source: "Week 13: long carts needed a second screenshot." },
  hourValue: {
    value: 140, label: "Value of one founder hour", unit: "MXN", tag: "A",
    source: "Founder's expected entry salary midpoint (MX$22,500 a month, Week 1 Burn Rate) ÷ 160 hours.",
  },
} satisfies Record<string, Fact>;

export type PaymentMethod = "transfer" | "mp_link";
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transfer: "Bank transfer or cash (pilot, no fee)",
  mp_link: "Mercado Pago link (at scale: 3.49% + MX$4 + IVA)",
};

export const PLANS = {
  free: { id: "free", name: "Free", price: 0, checks: 1, unit: "1 full check a month, on this device" },
  pack: { id: "pack", name: "4-check pack", price: 60, checks: 4, unit: "MX$15 a check · 4 checks · doesn't expire" },
  pass: { id: "pass", name: "30-day pass", price: 49, days: 30, unit: "Unlimited checks for 30 days from first use · no auto-renew" },
} as const;
export const PRICE_PER_CHECK = PLANS.pack.price / PLANS.pack.checks; // 15

/** What a processor takes from one charge. The pilot is paid by transfer, which costs nothing. */
export function paymentFee(amount: number, method: PaymentMethod): number {
  if (method === "transfer" || amount <= 0) return 0;
  return (amount * F.mpPct.value + F.mpFixed.value) * (1 + F.iva.value);
}

/** 10:1 test. Value of one check ≈ P(size fails) × pesos at risk. Holds when pesos at risk ≥ price × 10 ÷ P. */
export function tenToOneThreshold(price: number, p = F.pSizeFails.value): number {
  return (price * 10) / p;
}
export function tenToOneRatio(atRisk: number, price: number, p = F.pSizeFails.value): number {
  return price > 0 ? (p * atRisk) / price : Infinity;
}
/** For the pass: pesos at risk that must be checked per month for MX$49 to stay 10:1. */
export const passMonthlyThreshold = () => tenToOneThreshold(PLANS.pass.price);

export function aiCostPerCheck(screenshots = F.screenshotsPerCheck.value): number {
  return F.aiUsdPerScreenshot.value * F.usdMxn.value * screenshots;
}

// ───────────────────────────── Revenue simulator ─────────────────────────────

export interface SimInputs {
  checkers: number;          // people who run at least one real check a month
  packConv: number;          // share of checkers who buy a 4-check pack in a month (0–1)
  passConv: number;          // share of checkers who buy a 30-day pass in a month (0–1)
  packPrice: number;         // MXN
  passPrice: number;         // MXN
  checksPerPassUser: number; // checks a month by a pass user
  issuerCardholders: number; // cardholders an issuer enrolls (a bet; 0 = none)
  issuerFee: number;         // MXN per enrolled cardholder per month (a bet)
  issuerActive: number;      // share of enrolled cardholders who actually check (0–1)
  upkeepHours: number;       // founder hours a month: return-rule table, codes, support
  hourValue: number;         // MXN
  payment: PaymentMethod;
}

export const INPUT_META: Record<Exclude<keyof SimInputs, "payment">, { label: string; min: number; max: number; step: number; pct?: boolean; tag: Tag; note: string }> = {
  checkers: { label: "People who run a real check each month", min: 0, max: 1_000_000, step: 50, tag: "A", note: "Not measured yet: the event log counts visits, not people." },
  packConv: { label: "Buy a 4-check pack in a month", min: 0, max: 1, step: 0.005, pct: true, tag: "A", note: "Measured so far: 0 paid (see /pricing)." },
  passConv: { label: "Buy a 30-day pass in a month", min: 0, max: 1, step: 0.005, pct: true, tag: "A", note: "Measured so far: 0 paid." },
  packPrice: { label: "Pack price (4 checks), MXN", min: 0, max: 1000, step: 5, tag: "M", note: "Price on /pricing." },
  passPrice: { label: "30-day pass price, MXN", min: 0, max: 1000, step: 1, tag: "M", note: "Price on /pricing." },
  checksPerPassUser: { label: "Checks a month by a pass user", min: 0, max: 200, step: 1, tag: "A", note: "A heavy buyer: ~30 purchases a year ≈ 2.5 a month, plus re-checks." },
  issuerCardholders: { label: "Issuer: enrolled cardholders (a bet)", min: 0, max: 5_000_000, step: 100, tag: "A", note: "No issuer has been asked. Keep at 0 unless testing the bet." },
  issuerFee: { label: "Issuer: MXN per enrolled cardholder a month (a bet)", min: 0, max: 100, step: 0.5, tag: "A", note: "Invented starting point." },
  issuerActive: { label: "Issuer: share of cardholders who actually check", min: 0, max: 1, step: 0.01, pct: true, tag: "A", note: "Most card benefits go unused." },
  upkeepHours: { label: "Founder hours a month (rules, codes, support)", min: 0, max: 744, step: 1, tag: "A", note: "Condition 6: the price must cover delivery and support." },
  hourValue: { label: "Value of one founder hour, MXN", min: 0, max: 5000, step: 10, tag: "A", note: "Entry-salary midpoint ÷ 160 h (Week 1 Burn Rate)." },
};

const base = {
  packPrice: PLANS.pack.price,
  passPrice: PLANS.pass.price,
  checksPerPassUser: 6,
  issuerCardholders: 0,
  issuerFee: 5,
  issuerActive: 0.1,
  upkeepHours: 8,
  hourValue: F.hourValue.value,
  payment: "transfer" as PaymentMethod,
};

export const PRESETS: { id: string; name: string; note: string; inputs: SimInputs }[] = [
  { id: "measured", name: "Measured so far", note: "0 paid. This is the only preset built on evidence.", inputs: { ...base, checkers: 50, packConv: 0, passConv: 0 } },
  { id: "pessimistic", name: "Pessimistic", note: "Assumed.", inputs: { ...base, checkers: 100, packConv: 0.01, passConv: 0.005 } },
  { id: "base", name: "Base", note: "Assumed.", inputs: { ...base, checkers: 500, packConv: 0.03, passConv: 0.01 } },
  { id: "optimistic", name: "Optimistic", note: "Assumed.", inputs: { ...base, checkers: 2000, packConv: 0.06, passConv: 0.02, payment: "mp_link" } },
];

/** Clamp every input into its range; NaN and non-numbers fall back to the base preset. */
export function cleanInputs(raw: Partial<Record<keyof SimInputs, unknown>>): SimInputs {
  const fallback = PRESETS[2].inputs;
  const out = { ...fallback } as SimInputs;
  for (const k of Object.keys(INPUT_META) as (keyof typeof INPUT_META)[]) {
    const m = INPUT_META[k];
    const v = Number(raw[k]);
    out[k] = Number.isFinite(v) ? Math.min(m.max, Math.max(m.min, v)) : fallback[k];
  }
  out.payment = raw.payment === "mp_link" ? "mp_link" : "transfer";
  return out;
}

export interface SimResult {
  packBuyers: number;
  passBuyers: number;
  revenue: { pack: number; pass: number; issuer: number; total: number };
  fees: number;
  checks: number;
  aiCost: number;
  upkeep: number;
  contribution: number; // revenue − fees − AI
  net: number;          // contribution − upkeep
  annual: { revenue: number; net: number };
  revenuePerChecker: number;
  breakEvenCheckers: number | null; // null = never breaks even at these rates
}

export function simulate(raw: SimInputs): SimResult {
  const i = cleanInputs(raw as unknown as Record<keyof SimInputs, unknown>);
  const packBuyers = i.checkers * i.packConv;
  const passBuyers = i.checkers * i.passConv;
  const revenue = {
    pack: packBuyers * i.packPrice,
    pass: passBuyers * i.passPrice,
    issuer: i.issuerCardholders * i.issuerFee,
    total: 0,
  };
  revenue.total = revenue.pack + revenue.pass + revenue.issuer;
  const fees = packBuyers * paymentFee(i.packPrice, i.payment) + passBuyers * paymentFee(i.passPrice, i.payment);
  // Every checker uses the free check; pack buyers use their 4; pass users and active issuer cardholders check more.
  const checks =
    i.checkers * PLANS.free.checks +
    packBuyers * PLANS.pack.checks +
    passBuyers * i.checksPerPassUser +
    i.issuerCardholders * i.issuerActive * i.checksPerPassUser;
  const aiCost = checks * aiCostPerCheck();
  const upkeep = i.upkeepHours * i.hourValue;
  const contribution = revenue.total - fees - aiCost;
  const net = contribution - upkeep;
  // Break-even on buyer revenue alone (issuer left out: it doesn't grow with checkers).
  const perChecker = i.checkers > 0 ? (revenue.pack + revenue.pass - fees - (checks - i.issuerCardholders * i.issuerActive * i.checksPerPassUser) * aiCostPerCheck()) / i.checkers : 0;
  const issuerMargin = revenue.issuer - i.issuerCardholders * i.issuerActive * i.checksPerPassUser * aiCostPerCheck();
  const needed = upkeep - issuerMargin;
  const breakEvenCheckers = needed <= 0 ? 0 : perChecker > 0 ? Math.ceil(needed / perChecker) : null;
  return {
    packBuyers,
    passBuyers,
    revenue,
    fees,
    checks,
    aiCost,
    upkeep,
    contribution,
    net,
    annual: { revenue: revenue.total * 12, net: net * 12 },
    revenuePerChecker: i.checkers > 0 ? revenue.total / i.checkers : 0,
    breakEvenCheckers,
  };
}

export const money = (n: number, digits = 0) =>
  (n < 0 ? "−" : "") + "MX$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const ratio = (r: number) => (Number.isFinite(r) ? `${r >= 20 ? r.toFixed(0) : r.toFixed(1)}:1` : "∞");
