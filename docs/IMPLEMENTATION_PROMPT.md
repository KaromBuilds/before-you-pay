# IMPLEMENTATION PROMPT — Week 12 core build (generated from PACKET.md)

You are rebuilding **Before You Pay** in this repo (Next.js 15 App Router, TypeScript). Follow `docs/CHARTER.md` and `docs/PACKET.md`. Small testable features, one commit each. Never add a feature outside the Charter's core concepts.

## Features, acceptance criteria, commit plan

1. **Tailwind + venture shell.** Add Tailwind v4. Layout with header (Before You Pay · Product · About · History · Sign in) and footer ("No store pays us. No affiliate links."). Pages: `/` (need, 10:1 case, CTA), `/product` (the core), `/about` (the need, who pays, the 10:1 case, the founder's Method), `/history`.
   *Accept:* all four routes render at 390 px with no horizontal scroll. *Commit:* "Venture shell".
2. **Step-5 engine.** `lib/engine.ts`: `analyze(extraction, policy)` → amount paid, money at risk = confirmed final sale + return not confirmed, per-item status, flags (each with exactly one `nextStep`), one headline next step. No fit memory. `lib/policies.ts`: curated table with window days, fee, source URL, check date, status; Zara México from zara.com/mx (30 days, discounted items not stated).
   *Accept:* `npm test` covers T2–T9; banned words ("safe", "will fit", "guaranteed") never appear. *Commit:* "Step-5 engine".
3. **Core flow on /product.** Upload → `/api/extract` (keep the Week 10 reader) → editable items → engine result → decision buttons. Fictional sample labeled SIMULATED.
   *Accept:* T1, T5, T10. *Commit:* "Core flow".
4. **Auth + data layer.** Supabase client, Sign in with Google, `byp_checks` table (see `supabase/schema.sql`) with RLS owner-only and CHECK constraints. Save stores names, sizes, prices, result and decision, never the image. `/history` lists checks, shows North Star "pesos kept", deletes.
   *Accept:* T11–T13. *Commit:* "Saved checks with Google sign-in and RLS".
5. **Deploy + domain.** Push → Vercel. Add env vars. Connect the real domain. Add the domain to Supabase redirect URLs.
   *Accept:* T14 on the real domain. *Commit:* "Decisions log: deploy".
6. **Test pass + persona fix.** Run T1–T14, fix at least one bug, redeploy, log in DECISIONS.md.
