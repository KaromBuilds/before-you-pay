# Before You Pay

Check your size and what's really at risk **before** you pay for clothes online.

Upload a checkout screenshot. The app reads every item, size and price (Gemini vision), lets you correct anything, and then shows:

- **Amount you'd pay** vs. **conditional exposure**: the money you could be stuck with if the size fails and the return isn't confirmed.
- **Fit warnings** from your own fit memory (which size fit you, or didn't, in each brand) plus one measured garment. These are never a guarantee.
- **The store's return rule**, always with its source, check date and status (advertised / supported / unverified). Unknown stays unknown.
- **Reasons to wait**, then your call: "I'll wait" or "Buy anyway, my call". The app never places an order.

No store, no product recommendations, no affiliate links. Fit memory is saved only in your browser and can be deleted with one click.

Week 10 · Business Bending · Team 7 Blueprint (Regret prevention). See `docs/PACKET.md` and `docs/DECISIONS.md`.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your Gemini key (optional: without it the app runs a labeled SIMULATED demo)
npm run dev
npm test                     # rule-engine checks
```

## Deploy

Vercel → import this repo → Environment Variables → `GEMINI_API_KEY` → Deploy. The key lives only in Vercel, never in the repo.
