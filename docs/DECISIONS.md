# DECISIONS — Before You Pay (venture, Weeks 12–17)

## Session 1 (2026-11-01) — Week 12, charter before code
- Venture picked in my Week 12 Verdict: Before You Pay (Week 10, Regret). My first pick, Week 9, collided with Rafael's Lupa under the Uniqueness Rule; I moved instead of contesting it.
- **Rebuilt in the same repo.** The Week 10 ship is preserved as git tag `w10-ship` and its docs in `docs/w10/`. Reusing the repo keeps the Vercel project and the existing secret Gemini key, so I don't have to re-paste the key anywhere.
- **Scope cut vs. Week 10:** fit memory, reference garment and wrist measurement are removed. The Verdict cut fit prediction, and the Charter's core concepts don't include fit. The core is now money at risk + return rule + pressure flags + decision → saved.
- **Reused on purpose:** the Week 10 screenshot reader (`/api/extract`) and the policy-text keyword reader, both tested in production in Week 10. The engine is rewritten around the Charter's nouns, and every flag carries a next step (Team 8 Condition 5).
- **Data layer:** Supabase `byp_checks` with RLS. The screenshot image is never stored (Charter principle 4).
- Charter, Personas and Packet were written and committed before any app code.
