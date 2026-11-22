import { Suspense } from "react";
import type { Metadata } from "next";
import RuleDesk from "@/components/RuleDesk";
import { pieceById } from "@/lib/content";

// The link preview a buyer sees in WhatsApp matches the piece the link points to (?p=…).
const PREVIEW: Record<string, { title: string; description: string; image: string }> = {
  zara: {
    title: "Zara México: what its return page says (and doesn't)",
    description: "30 days from the shipping date. Discounted items: the page doesn't say. Checked Nov 22, 2026.",
    image: "/rules/zara-card.png",
  },
  "two-jackets": {
    title: "Cart autopsy: two jackets, one code (fictional)",
    description: "A fictional cart taken apart: MX$6,565 at risk if the size fails.",
    image: "/rules/two-jackets-poster.png",
  },
  "five-days": {
    title: "It arrived too big? Your five business days",
    description: "What Mexican law gives you after an online purchase arrives, and how to use it calmly.",
    image: "/rules/five-days-card.png",
  },
};
const DEFAULT = {
  title: "The rule desk — Before You Pay",
  description: "Return rules in each store's own words, dated and linked. What the store doesn't say counts as risk.",
  image: "/rules/zara-card.png",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ p?: string }> }): Promise<Metadata> {
  const { p } = await searchParams;
  const m = PREVIEW[pieceById(p)?.id ?? ""] ?? DEFAULT;
  return {
    title: m.title,
    description: m.description,
    metadataBase: new URL("https://beforeyoupay.xyz"),
    openGraph: { title: m.title, description: m.description, images: [{ url: m.image }], siteName: "Before You Pay", type: "article" },
    twitter: { card: "summary_large_image", title: m.title, description: m.description, images: [m.image] },
  };
}

export default function Rules() {
  return (
    <Suspense>
      <RuleDesk />
    </Suspense>
  );
}
