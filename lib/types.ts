export type Category = "apparel" | "footwear" | "accessory" | "other";

/** Line item: one product row read from the checkout screenshot. Every field is editable by the buyer. */
export interface Item {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: Category;
  listPrice: number | null; // unit price before discount, MXN
  paidPrice: number | null; // unit price actually charged, MXN
  qty: number;
  sizeHasCm?: boolean | null;
}

/** What the vision reader saw. The screenshot itself is never stored. */
export interface Extraction {
  store: string | null;
  items: Item[];
  discountCodes: string[];
  shipping: number | null;
  total: number | null;
  returnTermsVisible: string | null;
  pressureCues: string[];
  source: "screenshot" | "simulated";
  checkedAt: string;
}

export type Returnable = "yes" | "no" | "unknown";
/** advertised = the store's own words; unverified = we could not read the store's own words. Nothing is ever "verified" here. */
export type EvidenceStatus = "advertised" | "unverified";

/** Return rule: what a store's own text says, with its source and check date. */
export interface ReturnRule {
  store: string;
  aliases?: string[];
  regularReturnable: Returnable;
  discountedReturnable: Returnable;
  windowDays: number | null;
  costNote: string | null;
  status: EvidenceStatus;
  source: string;
  sourceUrl: string | null;
  checkedAt: string;
  note: string;
}

export type Level = "high" | "medium" | "info";

/** Pressure flag or risk flag. Team 8 Condition 5: every flag ends in exactly one next step. */
export interface Flag {
  id: string;
  level: Level;
  title: string;
  detail: string;
  nextStep: string;
}

export interface ItemRisk {
  itemId: string;
  amount: number;
  discounted: boolean;
  returnable: Returnable;
}

export interface Result {
  amountPaid: number | null;
  amountPaidSource: "total on screenshot" | "sum of items" | "unknown";
  /** Money at risk = confirmed final sale + return not confirmed. */
  moneyAtRisk: number;
  finalSale: number;
  notConfirmed: number;
  /** Week 13: total on the screen minus what we could read (items + shipping). Shown, never hidden. */
  unread: number;
  perItem: ItemRisk[];
  flags: Flag[];
  nextStep: string;
  rule: ReturnRule;
}

export type Decision = "wait" | "change_size" | "buy_anyway";
