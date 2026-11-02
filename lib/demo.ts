import type { Extraction } from "./types";

// FICTIONAL sample. Invented store, invented products, no real person's data (security floor #5).
export const DEMO_EXTRACTION: Extraction = {
  store: "Cumbre Outdoor (fictional)",
  items: [
    { id: "d1", name: "Hooded Thermal Puffer Jacket", brand: "Cumbre", size: "L", category: "apparel", listPrice: 4990, paidPrice: 3817, qty: 1 },
    { id: "d2", name: "Thermal Puffer Jacket", brand: "Cumbre", size: "L", category: "apparel", listPrice: 4490, paidPrice: 2748, qty: 1 },
  ],
  discountCodes: ["WELCOME20"],
  shipping: 0,
  total: 6565,
  returnTermsVisible: null,
  pressureCues: ["Only 3 left in L"],
  source: "simulated",
  checkedAt: "2026-11-01",
};
