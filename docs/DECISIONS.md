# DECISIONS — Before You Pay

## Session 1 (2026-10-18)
- Vacuum: Regret prevention (Team 7 Blueprint). My slice: screenshot extraction + editable fields + conditional exposure / fit warnings (Conditions 2 and 3).
- The LLM only *reads* the screenshot. Exposure and fit warnings come from a deterministic rule engine, so every warning can be explained and tested.
- Fit memory lives only in the browser (localStorage) with a "Delete all" button. No database, no accounts: nothing personal is stored on a server (Condition 5).
- No real store policy is marked verified. Unknown stays unknown (Condition 2).
- Without an API key the app runs a clearly labeled SIMULATED extraction on a fictional checkout.
- Tomorrow's first move: deploy, run the persona test, fix the worst confusion.
