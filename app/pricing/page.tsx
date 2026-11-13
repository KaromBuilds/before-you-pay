import Link from "next/link";
import { F, PLANS, PRICE_PER_CHECK, money, ratio, tenToOneRatio, tenToOneThreshold, passMonthlyThreshold } from "@/lib/pricing";
import { CONVERSATIONS, FOUNDER_EXCLUDED, OUTCOMES, PACK_OFFERS_DECLARED, PACK_OFFERS_MADE, tally, type Outcome } from "@/lib/evidence";
import { IssuerInterest, RequestButton, TrackView } from "@/components/PlanActions";

export const metadata = { title: "Pricing — Before You Pay" };

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</div>
);
const Tag = ({ t }: { t: "M" | "S" | "A" }) => (
  <span className={`ml-1 rounded px-1 text-[10px] font-bold text-white ${t === "M" ? "bg-ok" : t === "S" ? "bg-navy-2" : "bg-warn"}`}>
    {t === "M" ? "measured" : t === "S" ? "sourced" : "assumed"}
  </span>
);

export default function Pricing() {
  const t = tally();
  const order: Outcome[] = ["rejected", "stated", "requested", "paid"];
  return (
    <div className="space-y-8">
      <TrackView event="pricing_view" />
      <section>
        <h1 className="text-3xl font-extrabold text-navy">Pricing</h1>
        <p className="mt-2 text-mute">
          Before the price, the job it prices: <b className="text-ink">paying for clothes online, in a sale, with a guessed size.</b>{" "}
          The buyer and the budget owner are the same person: you, with your own money. The unit is one check: one cart, up to 4 screenshots.
        </p>
      </section>

      {/* Team 5 Condition 1: reconstruct today's task and alternatives BEFORE showing a price. */}
      <Card>
        <h2 className="text-xl font-bold text-navy">What you do today, and what it costs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase text-mute">
              <tr><th className="py-2 pr-3">What you do</th><th className="py-2 pr-3">Money</th><th className="py-2 pr-3">Time</th><th className="py-2">Risk</th></tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              <tr>
                <td className="py-2 pr-3 font-semibold">Guess the size and pay</td>
                <td className="py-2 pr-3">If it doesn’t fit and the item is final sale or the rule is unknown, the whole item. A real Week 13 cart had {money(F.w13Cart.value)} at risk<Tag t="M" />; I lost {money(F.founderLoss.value)}<Tag t="M" />.</td>
                <td className="py-2 pr-3">None now. The surprise comes when the package arrives.</td>
                <td className="py-2">You find out after paying.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-semibold">Read the store’s return page yourself</td>
                <td className="py-2 pr-3">Free.</td>
                <td className="py-2 pr-3">5–10 minutes per store<Tag t="A" />.</td>
                <td className="py-2">Often silent on sale items (Zara) or contradicts itself (Palacio)<Tag t="M" />. Unknown stays unknown.</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-semibold">Buy two sizes, return one</td>
                <td className="py-2 pr-3">Twice the money tied up, plus return costs: Zara charges {money(F.zaraDropOff.value)} at a drop-off point (free in store)<Tag t="S" />.</td>
                <td className="py-2 pr-3">A trip to a store or drop-off point.</td>
                <td className="py-2">Only works if the store takes returns. The legal floor online is {F.art56Days.value} business days, freight paid by you<Tag t="S" />.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm"><b className="text-navy">Next step:</b> use your free check on the cart you’re about to pay. <Link href="/product" className="font-semibold underline">Check a checkout</Link></p>
      </Card>

      <section>
        <h2 className="text-xl font-bold text-navy">Plans</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold uppercase text-mute">Anyone</p>
            <h3 className="mt-1 text-lg font-bold text-navy">{PLANS.free.name}</h3>
            <p className="text-3xl font-extrabold text-navy">MX$0</p>
            <p className="mt-1 text-sm text-mute">{PLANS.free.unit}. The complete answer. No account. The fictional sample never counts.</p>
            <Link href="/product" className="mt-4 block rounded-xl border border-navy px-4 py-3 text-center font-semibold text-navy hover:bg-paper">Use my free check</Link>
          </Card>
          <Card className="border-navy">
            <p className="text-xs font-semibold uppercase text-warn">Segment 1 · sale-season buyer</p>
            <h3 className="mt-1 text-lg font-bold text-navy">{PLANS.pack.name}</h3>
            <p className="text-3xl font-extrabold text-navy">{money(PLANS.pack.price)}</p>
            <p className="mt-1 text-sm text-mute">{PLANS.pack.unit}. A check is only used when your screenshot is read.</p>
            <RequestButton plan="pack" primary />
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-warn">Segment 2 · buys a lot, or for several people</p>
            <h3 className="mt-1 text-lg font-bold text-navy">{PLANS.pass.name}</h3>
            <p className="text-3xl font-extrabold text-navy">{money(PLANS.pass.price)}</p>
            <p className="mt-1 text-sm text-mute">{PLANS.pass.unit}.</p>
            <RequestButton plan="pass" />
          </Card>
        </div>
        <p className="mt-3 rounded-xl border border-dashed border-navy bg-white px-4 py-3 text-sm">
          <b className="text-navy">The free / paid line:</b> paying buys <i>more checks</i>, never a different answer. A free check and a paid check run the same
          code and show the same money at risk, return rule, warnings and next step. No store, brand or marketplace pays us, ever.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold uppercase text-mute">Second payer · a bet, not for sale yet</p>
            <h3 className="mt-1 font-bold text-navy">For card issuers</h3>
            <p className="mt-1 text-sm text-mute">
              The 30-day pass as a cardholder benefit, paid per enrolled cardholder, never per purchase, so a bank can’t push “buy.”
              The issuer never sees screenshots, items or decisions and can’t change a word of the answer. No issuer has been asked yet.
            </p>
            <IssuerInterest />
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-mute">Not sold until it exists</p>
            <h3 className="mt-1 font-bold text-navy">Return-window alerts</h3>
            <p className="mt-1 text-sm text-mute">
              A reminder before a store’s return window closes would be part of the pass. It isn’t built, so it isn’t in any price.
            </p>
          </Card>
        </div>
      </section>

      <Card>
        <h2 className="text-xl font-bold text-navy">Is a check worth {money(PRICE_PER_CHECK)}? The 10:1 test</h2>
        <p className="mt-2 text-sm text-mute">
          One check is worth about <i>(chance the size fails) × (pesos you can’t get back)</i>. With a {Math.round(F.pSizeFails.value * 100)}% proxy<Tag t="A" />,
          a {money(PRICE_PER_CHECK)} check is 10:1 from <b className="text-ink">{money(tenToOneThreshold(PRICE_PER_CHECK))}</b> at risk.
          An average Hot Fashion 2026 order ({money(F.hotFashionOrder.value)}<Tag t="S" />) gives {ratio(tenToOneRatio(F.hotFashionOrder.value, PRICE_PER_CHECK))};
          the Week 13 cart gives {ratio(tenToOneRatio(F.w13Cart.value, PRICE_PER_CHECK))}. The pass needs about {money(passMonthlyThreshold())} at risk checked a month.
          Below the threshold, or at a store with free returns, a paid check isn’t worth it, and that’s what the free check is for.
        </p>
        <p className="mt-2 text-sm"><Link href="/about#ten-to-one" className="font-semibold text-navy underline">Read the full 10:1 memo</Link> · <Link href="/simulator" className="font-semibold text-navy underline">Play with the numbers in the simulator</Link></p>
      </Card>

      {/* Team 5 Condition 2: no, said yes, asked, paid: four separate columns. Only "paid" is revenue. */}
      <Card>
        <h2 className="text-xl font-bold text-navy">What payers actually did</h2>
        <p className="mt-1 text-sm text-mute">Every pricing conversation, in exactly one column. Only “Paid” counts as revenue. People are listed by role, never by name.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {order.map((o) => (
            <div key={o} className={`rounded-xl border p-3 ${o === "paid" ? "border-ok" : "border-line"}`}>
              <p className="text-2xl font-extrabold text-navy">{t[o]}</p>
              <p className="text-sm font-semibold">{OUTCOMES[o].label}</p>
              <p className="text-xs text-mute">{OUTCOMES[o].meaning}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {CONVERSATIONS.map((c) => (
            <li key={c.id} className="rounded-lg bg-paper px-3 py-2">
              <b>{c.date} · {c.who}</b> <span className="text-xs text-mute">({c.relation})</span>
              <span className="block text-mute">Asked: {c.offer}</span>
              <span className="block">→ <b>{OUTCOMES[c.outcome].label}:</b> {c.said}</span>
              {c.note && <span className="block text-xs text-mute">{c.note}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">
          Pack offers made: {PACK_OFFERS_MADE} of {PACK_OFFERS_DECLARED} declared for Buen Fin (Nov 13–17). Each answer is added here, including every no. {FOUNDER_EXCLUDED}
        </p>
      </Card>
    </div>
  );
}
