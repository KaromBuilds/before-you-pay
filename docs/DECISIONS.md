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
