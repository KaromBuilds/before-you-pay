// Week 14 · Pricing evidence ledger. Team 5 Condition 2: rejection, stated interest, requests and paid commitments
// are recorded SEPARATELY. A hypothetical yes never becomes demand or revenue.
// Condition 5: roles, never names. The founder adds a line after every pricing conversation.

export type Outcome = "rejected" | "stated" | "requested" | "paid";

export const OUTCOMES: Record<Outcome, { label: string; meaning: string }> = {
  rejected: { label: "Said no", meaning: "Heard the price and said no, with the reason they gave." },
  stated: { label: "Said yes, no money", meaning: "Said they would pay. Words, not money." },
  requested: { label: "Asked for the pack", meaning: "Took an action to get it: asked how to pay or sent a request." },
  paid: { label: "Paid", meaning: "Money received. The only column that counts as revenue." },
};

export interface Conversation {
  id: string;
  date: string;
  who: string; // a role, never a name
  relation: "stranger" | "known";
  offer: string;
  outcome: Outcome;
  said: string;
  note?: string;
  amount?: number; // MXN actually received (paid outcomes only)
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: "p1",
    date: "2026-11-10",
    who: "Friend · accountant at a small business, still studying accounting",
    relation: "known",
    offer: "Would you pay for a check like this? How much?",
    outcome: "stated",
    said: "She would pay up to MX$25 per check.",
    note: "A known person, so politeness is likely. No money changed hands. Her number is above the MX$15 price.",
  },
  // Week 14 declaration, done during Buen Fin (Nov 13–17) and reported on Nov 16: five WhatsApp offers of the pack.
  // All five were WhatsApp contacts, so all count as "known" (politeness risk).
  {
    id: "p2",
    date: "2026-11-16",
    who: "Classmate (school, not close) · had lost money on a discounted online order",
    relation: "known",
    offer: "4-check pack, MX$60, paid by transfer",
    outcome: "paid",
    amount: 60,
    said: "Same thing had happened to him; he wanted to try the service.",
    note: "One purchase is a signal, not recurring demand (Team 5 Week 15 Condition 3).",
  },
  ...[3, 4, 5].map((n) => ({
    id: `p${n}`,
    date: "2026-11-16",
    who: "WhatsApp contact · buys clothes online",
    relation: "known" as const,
    offer: "4-check pack, MX$60",
    outcome: "stated" as const,
    said: "Liked it: it had happened to them too and nobody advises them online. The price felt right. No money sent.",
  })),
  {
    id: "p6",
    date: "2026-11-16",
    who: "WhatsApp contact",
    relation: "known",
    offer: "4-check pack, MX$60",
    outcome: "rejected",
    said: "No longer buys clothes online; prefers to buy in physical stores.",
  },
];

/** The Blueprint declaration: five buyers get the MX$60 pack offer during Buen Fin (Nov 13–17). */
export const PACK_OFFERS_DECLARED = 5;
export const PACK_OFFERS_MADE = CONVERSATIONS.filter((c) => c.offer.includes("MX$60")).length;

export function tally(list: Conversation[] = CONVERSATIONS): Record<Outcome, number> {
  const t: Record<Outcome, number> = { rejected: 0, stated: 0, requested: 0, paid: 0 };
  for (const c of list) t[c.outcome] += 1;
  return t;
}

/** Founder's own willingness to pay is kept out of every count (founder bias). */
export const FOUNDER_EXCLUDED = "The founder's own answer (up to MX$100 a check) is not counted.";

/** Money actually received, in MXN. Only "paid" rows count. */
export const received = (list: Conversation[] = CONVERSATIONS) =>
  list.reduce((sum, c) => sum + (c.outcome === "paid" ? c.amount ?? 0 : 0), 0);
