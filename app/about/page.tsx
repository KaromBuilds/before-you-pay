import Link from "next/link";
import { F, PLANS, PRICE_PER_CHECK, money, passMonthlyThreshold, ratio, tenToOneRatio, tenToOneThreshold } from "@/lib/pricing";

export const metadata = { title: "About — Before You Pay" };

const T = (t: "M" | "S" | "A") => (
  <span className={`ml-1 rounded px-1 align-middle text-[10px] font-bold text-white ${t === "M" ? "bg-ok" : t === "S" ? "bg-navy-2" : "bg-warn"}`}>
    {t === "M" ? "measured" : t === "S" ? "sourced" : "assumed"}
  </span>
);
const MEMO_ROWS: [string, number][] = [
  ["Break-even for 10:1", tenToOneThreshold(PRICE_PER_CHECK)],
  ["Average Hot Fashion 2026 order", F.hotFashionOrder.value],
  ["Average online fashion order", F.fashionOrder.value],
  ["Real Week 13 cart", F.w13Cart.value],
  ["My own loss", F.founderLoss.value],
];
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

      <section id="ten-to-one" className="mt-8 scroll-mt-20 rounded-2xl border border-navy bg-white p-5">
        <p className="text-xs font-semibold uppercase text-mute">Week 14 · one page · same numbers as /pricing and /simulator</p>
        <h2 className="text-xl font-bold text-navy">The 10:1 memo</h2>
        <p className="mt-2">
          <b>Who:</b> a buyer on her phone paying for discounted clothes in a sale, with a guessed size. She is the buyer and the budget owner:
          it’s her money. <b>Same task, same period:</b> one sale-season checkout, the seconds before tapping “Pay.” What pushed a real Week 13
          buyer was <i>“las ofertas y las pocas unidades de mi talla.”</i>
        </p>
        <p className="mt-2">
          <b>What she does today:</b> guesses and pays; sometimes reads the store’s return page (5–10 minutes{T("A")}, and it is often silent on sale
          items{T("M")}); or buys two sizes and returns one ({money(F.zaraDropOff.value)} at a Zara drop-off point{T("S")}, plus a trip).
        </p>
        <p className="mt-2">
          <b>What it truly costs her.</b> <i>Money:</i> if the size fails on a final-sale or unconfirmed item, the whole item. A real Week 13 cart had{" "}
          {money(F.w13Cart.value)} at risk{T("M")}; I lost {money(F.founderLoss.value)} on two jackets{T("M")}. <i>Time:</i> a return trip, or nothing
          now and a surprise later. <i>Risk:</i> the rule is unknown until it’s too late; the legal floor online is {F.art56Days.value} business days,
          with the freight paid by her{T("S")}.
        </p>
        <p className="mt-2">
          <b>The price:</b> 1 full check a month free; then {money(PRICE_PER_CHECK)} a check ({PLANS.pack.checks} for {money(PLANS.pack.price)}), or{" "}
          {money(PLANS.pass.price)} for 30 days. Paid by her, never by a store. A card issuer paying per cardholder is a bet, not a sale.
        </p>
        <p className="mt-2">
          <b>Why the ratio holds.</b> A check is worth about (chance the size fails) × (pesos she can’t get back). With a{" "}
          {Math.round(F.pSizeFails.value * 100)}% proxy{T("A")}:
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs uppercase text-mute"><tr><th className="py-1">Pesos at risk on the cart</th><th className="py-1">Expected loss avoided</th><th className="py-1">Ratio at {money(PRICE_PER_CHECK)}</th></tr></thead>
          <tbody className="divide-y divide-line">
            {MEMO_ROWS.map(([label, v]) => (
              <tr key={label as string}>
                <td className="py-1">{label}: {money(v as number)}</td>
                <td className="py-1">{money(F.pSizeFails.value * (v as number))}</td>
                <td className="py-1 font-semibold">{ratio(tenToOneRatio(v as number, PRICE_PER_CHECK))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2">
          It holds from <b>{money(tenToOneThreshold(PRICE_PER_CHECK))}</b> at risk. At {money(25)} a check (what one payer said she’d pay) the average
          Hot Fashion order falls to {ratio(tenToOneRatio(F.hotFashionOrder.value, 25))}, which is why the price stays at {money(PRICE_PER_CHECK)}.
          The 30-day pass needs about {money(passMonthlyThreshold())} at risk checked a month: it fits a buyer with ~{F.purchasesHeavy.value} purchases a
          year{T("M")}, not the average buyer with {F.purchasesAvg.value}{T("S")}. <b>Where it doesn’t hold:</b> small carts and stores with free returns.
          That’s what the free check is for.
        </p>
        <p className="mt-2 rounded-lg bg-warn-bg px-3 py-2 text-sm text-warn">
          <b>What we don’t know yet.</b> The {Math.round(F.pSizeFails.value * 100)}% is a US proxy, not measured in Mexico. Avoided loss isn’t measured
          either: we can’t yet see whether a buyer who waited would have gotten the wrong size. Nobody has paid so far. Until those are measured, this
          10:1 is a hypothesis, not a fact.
        </p>
      </section>

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
