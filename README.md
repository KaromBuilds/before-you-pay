# Before You Pay

**See what you'd lose if the size is wrong, before you pay.** Upload a screenshot of any online clothing checkout and see the pesos at risk under that store's real return rule, what's pushing you to pay fast, and one next step for each flag. Then choose: wait, change the size first, or buy anyway (your call). Sign in with Google to save checks to a private history.

Venture for Weeks 12–17 (Team 8). Read first: [`docs/CHARTER.md`](docs/CHARTER.md) · [`docs/PERSONAS.md`](docs/PERSONAS.md) · [`docs/PACKET.md`](docs/PACKET.md) · [`docs/DECISIONS.md`](docs/DECISIONS.md). The Week 10 ship is tagged `w10-ship`.

## How it works
- `app/api/extract` — Gemini vision reads **only what's visible** on the screenshot into strict JSON. The image is not stored.
- `lib/engine.ts` — the Step-5 engine: deterministic, tested rules compute money at risk (confirmed final sale + return not confirmed) and flags, each with exactly one next step.
- `lib/policies.ts` — curated return rules with source URL, check date and status. Unknown stays unknown.
- `supabase/schema.sql` — `byp_checks` with Row Level Security (owner-only select/insert/delete) and CHECK constraints.

## Run locally
```bash
npm install
cp .env.example .env.local   # Gemini key + Supabase URL/anon key (all optional; without Gemini the app offers a labeled SIMULATED sample)
npm run dev
npm test
```

## Environment (Vercel → Settings → Environment Variables)
`GEMINI_API_KEY` (secret, server only) · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public by design; RLS protects the rows).

No store pays for this product. No affiliate links. It never recommends a product.
