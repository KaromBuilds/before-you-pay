import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-warn">Before you tap “Pay”</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">
          See what you’d lose if the size is wrong.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-mute">
          Upload a screenshot of your checkout. In under a minute you see the pesos at risk under that store’s real return rule,
          what’s pushing you to pay fast, and one thing to do about it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/product" className="rounded-xl bg-navy px-5 py-3 font-semibold text-white hover:bg-navy-2">
            Check my checkout
          </Link>
          <Link href="/product?sample=1" className="rounded-xl border border-navy px-5 py-3 font-semibold text-navy hover:bg-white">
            Try the fictional sample
          </Link>
        </div>
        <p className="mt-3 text-xs text-mute">Free. No account needed to check. Sign in with Google only to save your history.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1", "Screenshot", "The checkout you already have, from any store. We read it; we never keep the image."],
          ["2", "Money at risk", "Final-sale items plus items whose return the store doesn’t confirm. Unknown counts as risk, never as protected."],
          ["3", "Your call", "Wait, change the size first, or buy anyway. We never place an order or recommend a product."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl border border-line bg-white p-5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sm font-bold text-white">{n}</span>
            <h2 className="mt-3 font-bold text-navy">{t}</h2>
            <p className="mt-1 text-sm text-mute">{d}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-xl font-bold text-navy">Why this exists</h2>
        <p className="mt-2 text-mute">
          I paid <b className="text-ink">MX$6,565</b> for two discounted jackets, both one size too big. The discount meant no return.
          The rule wasn’t on the checkout screen, and the store’s policy page didn’t even load. Return statistics only count the regret
          people are allowed to send back. The rest sits in closets.
        </p>
        <Link href="/about" className="mt-3 inline-block text-sm font-semibold text-navy underline">Read the full case</Link>
      </section>
    </div>
  );
}
