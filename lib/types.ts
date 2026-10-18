export type Category = "apparel" | "footwear" | "accessory" | "other";

export interface Item {
  id: string;
  name: string;
  brand: string;
  size: string;
  category: Category;
  listPrice: number | null; // price before discount, MXN
  paidPrice: number | null; // price after discount, MXN (per unit)
  qty: number;
  sizeHasCm: boolean | null; // does the listing give centimeters for the size?
}

export interface Extraction {
  store: string | null;
  items: Item[];
  discountCodes: string[];
  shipping: number | null;
  total: number | null;
  returnTermsVisible: string | null; // return/exchange text visible on the screenshot, verbatim
  pressureCues: string[]; // e.g. "Only 2 left", "Offer ends in 01:59:00"
  source: "screenshot" | "simulated";
  checkedAt: string; // ISO date
}

export type Outcome = "fit" | "too_big" | "too_small";

export interface FitRecord {
  id: string;
  brand: string;
  category: Category;
  size: string;
  outcome: Outcome;
}

export interface Reference {
  chestCm: number | null; // flat chest width of one garment that fits
  lengthCm: number | null; // length of that garment
  wristCm: number | null; // wrist circumference (paper strip)
}

export type Returnable = "yes" | "no" | "unknown";
export type EvidenceStatus = "advertised" | "supported" | "unverified";

export interface PolicyNote {
  store: string;
  regularReturnable: Returnable;
  discountedReturnable: Returnable;
  status: EvidenceStatus;
  source: string;
  checkedAt: string;
  note: string;
}

export type Level = "high" | "medium" | "low" | "info";

export interface Warning {
  itemId: string | null; // null = cart-level
  level: Level;
  title: string;
  detail: string;
}

export interface ItemExposure {
  itemId: string;
  amount: number;
  discounted: boolean;
  returnable: Returnable;
}

export interface Analysis {
  amountPaid: number | null;
  amountPaidSource: "total on screenshot" | "sum of items" | "unknown";
  confirmedNonReturnable: number;
  unconfirmed: number;
  conditionalExposure: number;
  perItem: ItemExposure[];
  warnings: Warning[];
  reasonsToWait: string[];
  policy: PolicyNote;
}
