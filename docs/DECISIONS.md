# DECISIONS — Before You Pay (venture, Weeks 12–17)

## Session 1 (2026-11-01) — Week 12, charter before code
- Venture picked in my Week 12 Verdict: Before You Pay (Week 10, Regret). My first pick, Week 9, collided with Rafael's Lupa under the Uniqueness Rule; I moved instead of contesting it.
- **Rebuilt in the same repo.** The Week 10 ship is preserved as git tag `w10-ship` and its docs in `docs/w10/`. Reusing the repo keeps the Vercel project and the existing secret Gemini key, so I don't have to re-paste the key anywhere.
- **Scope cut vs. Week 10:** fit memory, reference garment and wrist measurement are removed. The Verdict cut fit prediction, and the Charter's core concepts don't include fit. The core is now money at risk + return rule + pressure flags + decision → saved.
- **Reused on purpose:** the Week 10 screenshot reader (`/api/extract`) and the policy-text keyword reader, both tested in production in Week 10. The engine is rewritten around the Charter's nouns, and every flag carries a next step (Team 8 Condition 5).
- **Data layer:** Supabase `byp_checks` with RLS. The screenshot image is never stored (Charter principle 4).
- Charter, Personas and Packet were written and committed before any app code.

## Session 1, deploy 1 (2026-11-01)
- Pushed to `main`; Vercel auto-deployed (deploy 1, Ready). The Week 10 ship is preserved as branch `w10-ship` (the proxy refused the tag push).
- **Bug found live (T14):** the fictional sample screenshot sent to `/api/extract` on the live URL hung for 60 s and returned `FUNCTION_INVOCATION_TIMEOUT` (504). One slow model call ate the entire function budget, so the fallback never ran. **Fix:** Flash-Lite goes first (reading a checkout doesn't need a reasoning model), and each model gets its own time budget (22 s, then 30 s) with an abort signal, so a slow model fails fast and the next one still runs inside the 60 s limit.
- **Bug found in the mechanical pass (T6):** the fictional sample showed *'"Hooded Thermal Puffer Jacket" appears twice'*, but the cart has two *different* jackets. The similarity check was right; the wording was false, which breaks Charter principle 2 (no false statements). **Fix:** identical names say "appears twice"; similar names are listed as a pair ("…are very similar"). A regression test was added (12/12 pass).
- **Bug found in the unit tests:** the Week 10 policy reader took "Los artículos en promoción no aceptan devoluciones" to mean the store accepts no returns at all, so it marked full-price items final sale too. **Fix:** a no-returns sentence only applies store-wide when it doesn't mention discounts.
- Re-test of the reader after the timeout fix: the fictional sample was read in 2.3 s, with all fields, the fine-print "final sale" and the pressure cue.

## Persona test (Layer 1) — Rocío Hernández, 51 (docs/PERSONAS.md)
- I walked Rocío through 7 phone screens (390 px), narrating as her: reads slowly, distrusts apps, quits silently when lost or when she thinks she needs an account.
- **Worst confusion (fixed):** the decision buttons ("I'll wait…") sat *below* the full editable form: two item cards with eight fields each, all labeled "simulated." Rocío reads the number, scrolls into a form that looks like work, decides "this asks me to fill things in" and quits before she reaches her choice. **Fix:** new order is answer → flags → **Your call** → return rule → "What we read" (collapsed, opens on its own only when a size or price is missing). The decision now starts 1.8 screens below the top of the result.
- **Second confusion (fixed):** a large "Sign in with Google" button in the header on the check page made her think she needed an account first. **Fix:** the header button now just says "Sign in," and a green line under the title says "No account needed to check."
- **Third confusion (fixed):** she didn't know what a "checkout screenshot" was or how to take one. **Fix:** the upload box now says "The screen with your cart and the total" and shows the screenshot buttons for iPhone and Android.
- Also fixed: the "final sale" pill broke over two lines; the word "simulated" appeared on every field (it's now shown once, in the banner).
- Logged, not fixed: the UI is in English (a course requirement) while Rocío reads Spanish. This is the first thing to test with real users in Week 13.

## Session 1, domain + data layer (2026-11-01)
- **Real domain live:** `beforeyoupay.xyz`, bought on Vercel (auto-renew off) and attached to Production. Valid Configuration; https://beforeyoupay.xyz/product serves the latest deploy.
- Supabase (`semestre` project): `byp_checks` created with RLS; redirect URLs added for the domain and the vercel.app URL.
- Google sign-in: a dedicated Google Cloud project, "Before You Pay," so the consent screen shows the venture's name. It has a web OAuth client with the Supabase callback, branding links (home / privacy / about), authorized domain beforeyoupay.xyz, and is published to production. The client ID and the provider toggle are set in Supabase.
- **Client secret:** the founder pasted the OAuth client secret into Supabase → Google himself. Verified: provider on, client ID and a `GOCSPX-` secret stored.
- **Supabase URL + publishable key in code (`lib/supabase.ts`) instead of Vercel env vars.** Both are public by design: they ship to every browser in the page's JavaScript either way, and RLS is what protects the rows. The secret / service_role key is never in the repo, the app or Vercel. The only real secret, `GEMINI_API_KEY`, stays in Vercel env (security floor #1). The Site URL in Supabase was left untouched because other apps share this project.

## Session 1, end-to-end test on the real domain (2026-11-01)
- **T11:** on https://beforeyoupay.xyz/product?sample=1, choosing "I'll wait" without signing in shows "Sign in with Google to save"; nothing is written.
- **T12:** Sign in with Google (consent screen "Before You Pay") → the check restored after the redirect → "Save to my history" → "Saved." → /history shows *Cumbre Outdoor (fictional) · MX$6,565 at risk · Waited*, and the North Star reads **MX$6,565 pesos kept**.
- **T13 (RLS):** with only the public key and no session, `GET /rest/v1/byp_checks` returns `[]` (the saved row is invisible), and an anonymous `POST` is rejected with `401 / 42501 new row violates row-level security policy`.

## Tomorrow's first move
- Record the demo on beforeyoupay.xyz, then start Week 13: five real users, beginning with Spanish-speaking buyers like Rocío (the English UI is the first risk to test).

