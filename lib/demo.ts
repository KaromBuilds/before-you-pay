import type { Extraction, FitRecord, Reference } from "./types";

// FICTIONAL demo data. Invented store, invented products. No real person's data.
export const DEMO_EXTRACTION: Extraction = {
  store: "Cumbre Outdoor (fictional)",
  items: [
    {
      id: "d1",
      name: "Hooded Thermal Puffer Jacket",
      brand: "Cumbre",
      size: "L",
      category: "apparel",
      listPrice: 4990,
      paidPrice: 3817,
      qty: 1,
      sizeHasCm: false,
    },
    {
      id: "d2",
      name: "Thermal Puffer Jacket",
      brand: "Cumbre",
      size: "L",
      category: "apparel",
      listPrice: 4490,
      paidPrice: 2748,
      qty: 1,
      sizeHasCm: false,
    },
  ],
  discountCodes: ["WELCOME20"],
  shipping: 0,
  total: 6565,
  returnTermsVisible: null,
  pressureCues: ["Only 3 left in L"],
  source: "simulated",
  checkedAt: "2026-10-18",
};

export const DEMO_MEMORY: FitRecord[] = [
  { id: "m1", brand: "Cumbre", category: "apparel", size: "L", outcome: "too_big" },
  { id: "m2", brand: "Cumbre", category: "apparel", size: "M", outcome: "fit" },
  { id: "m3", brand: "Ola Denim (fictional)", category: "apparel", size: "30", outcome: "too_small" },
];

export const DEMO_REFERENCE: Reference = { chestCm: 56, lengthCm: 70, wristCm: 17 };
