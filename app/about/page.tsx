import Link from "next/link";

export const metadata = { title: "About — Before You Pay" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-8 text-xl font-bold text-navy">{children}</h2>;

export default function About() {
  return (
    <article className="max-w-2xl text-[15px] leading-relaxed">
      <h1 className="text-3xl font-extrabold text-navy">About Before You Pay</h1>

      <H>The need</H>
      <p className="mt-2">
        Online clothing checkouts in Mexico are built for speed: a discount code, a “last units” banner, one tap to pay. The one fact that
        would stop a bad purchase isn’t on that screen: <b>what happens to your money if the size is wrong.</b> Discounted items are often
        final sale, and the rule hides behind a policy link few people open. This month my mother bought two pairs of pants online with a
        guessed size. I lost MX$6,565 on two jackets I couldn’t return.
      </p>

      <H>The 10:1 case</H>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase text-mute">Today</p>
          <p className="mt-1">Nothing is checked. The return rule isn’t on the checkout, and the loss shows up weeks later, when the package arrives.</p>
        </div>
        <div className="rounded-xl border border-navy bg-white p-4">
          <p className="text-xs font-semibold uppercase text-navy">With Before You Pay</p>
          <p className="mt-1">A 30-second check before paying shows the exact pesos at risk and one next step. Thirty seconds against thousands of pesos you can’t get back.</p>
        </div>
      </div>

      <H>Who pays</H>
      <p className="mt-2">
        <b>Never the store.</b> No affiliate links, no sponsored stores, no data sales. If a store paid, the product would start optimizing
        for the sale, and “wait” would stop being an honest answer. The single check is free. Our bet, still to be tested with real users:
        frequent online buyers pay a small fee for saved history and wider store coverage. It’s a bet, not a fact yet.
      </p>

      <H>How the answer is made</H>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>An AI model <b>only reads</b> your screenshot: items, sizes, prices, codes and any visible return wording. You can correct every field.</li>
        <li>Tested rules, not the AI, compute the money at risk from a <b>curated table of return rules</b>, each with its source and the date we checked it.</li>
        <li>If a store doesn’t say discounted items can be returned, that money counts as <b>at risk</b>. Unknown never becomes “protected.”</li>
        <li>Every warning ends in <b>one next step</b> you can take right now.</li>
        <li>Your screenshot is never stored. Saved checks hold only names, sizes, prices, the result and your decision, visible only to you.</li>
      </ul>

      <H>Who made it</H>
      <p className="mt-2">
        Karom Asael González Martínez, Global Business student at Universidad Iberoamericana (logistics and international trade). Before You
        Pay comes from my working method: start from someone I know who lives the problem, find why nobody serves them, and turn what they
        already have, here a screenshot, into something visible. Every return that does happen is a truck driving backwards that someone
        pays for. Stopping the wrong purchase is cheaper for everyone.
      </p>

      <Link href="/product" className="mt-8 inline-block rounded-xl bg-navy px-5 py-3 font-semibold text-white">Check a checkout</Link>
    </article>
  );
}
