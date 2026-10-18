# DECISIONS — Before You Pay

## Session 1 (2026-10-18)
- Vacuum: Regret prevention (Team 7 Blueprint). My slice: screenshot extraction + editable fields + conditional exposure / fit warnings (Conditions 2 and 3).
- The LLM only *reads* the screenshot. Exposure and fit warnings come from a deterministic rule engine, so every warning can be explained and tested.
- Fit memory lives only in the browser (localStorage) with a "Delete all" button. No database, no accounts: nothing personal is stored on a server (Condition 5).
- No real store policy is marked verified. Unknown stays unknown (Condition 2).
- Without an API key the app runs a clearly labeled SIMULATED extraction on a fictional checkout.
- Tomorrow's first move: deploy, run the persona test, fix the worst confusion.

## Session 2 (2026-10-18)
- Deploy 1 failed on Vercel: Next.js 15.5.4 was blocked as a vulnerable version. Upgraded to 15.5.28, rebuilt, tests pass, redeployed: live at https://before-you-pay-wine.vercel.app
- GEMINI_API_KEY added as a Secret environment variable in Vercel (never in the repo). Redeploying so the real screenshot reader turns on.
- Next: test a real checkout screenshot on the live URL, run the persona test, fix the worst confusion, redeploy.
