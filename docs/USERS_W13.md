# USERS — Week 13 · Real Humans (Layer 2)

Format: remote, unmoderated sessions on the user's own phone. Each user got the live link (beforeyoupay.xyz/product), a task ("upload a screenshot of a cart you have, use it as if you were about to pay") and five questions written to catch confusion the user doesn't notice (Q2: "in your own words, what did the app tell you?") and to resist politeness (Q4: "be honest; if not, tell me why"). Behavior was cross-checked against the anonymous event log (`byp_events`: event, rule known, phone/desktop; no names, no content). Users are recorded by role, never by name. Event times are reported by day (Team 8 Condition 3).

## Session 1 — Amazon buyer (phone) · Nov 5
- **Tried:** a screenshot of an Amazon cart. Uploaded twice (event log: two uploads in the same visit), then chose **I'll wait**.
- **Struggled:** couldn't fit the whole cart in one screenshot, and the app took only one image.
- **Exact quotes:** *"No me trabé como tal en nada, pero no me dejó subir múltiples fotos, entonces no enfoqué todo el carrito."* · What the app said: *"Me dijo que no hay políticas de retorno y que mi dinero quedaría en riesgo."* · Would use it: *"Pues lo usaría si me diera más información."*
- **Read:** the "no me trabé, pero…" pattern: under Team 8's "regla del pero," what comes after the *pero* is the data. Amazon isn't in the rule table, so the only answer was "everything at risk."

## Session 2 — 24, buying on the Zara app (phone) · Nov 5
- **Tried:** a screenshot of a Zara-app cart (dark mode, three items visible). Ran Safari's auto-translate on the app. Event log: one upload, read OK, store rule **not** found, **no decision button pressed**.
- **Struggled (observed, not reported):** the result showed **MX$4,997 at risk** while "You'd pay (total on screenshot)" showed **MX$9,492**; the unread items weren't counted at all. The store came back as "tienda desconocida," because the Zara app never prints its name on the cart, so the Zara rule in the table never fired. Machine translation garbled the UI ("en riesgo si el **tamaño** falla," "Nunca hamos un pedido").
- **Exact quotes:** Where did you get stuck: *"Ninguna."* · What's pushing this purchase: *"Las ofertas y las pocas unidades de mi talla."* · What the app said: *"Buscar las políticas de devolución de la tienda."* · Would use it: *"Sí. Para saber sobre devolución y venta final confirmada."*
- **Read:** she reported no problem, while her own screenshot shows the biggest one. Declared ≠ observed (Team 8 Condition 1). The pressure flags matched her own reasons in her own words.

## Pain ranking (by threat to the 10:1 case)

| # | Pain | Evidence | Why it threatens the 10:1 |
|---|---|---|---|
| 1 | **Long carts:** one screenshot only; items off-screen aren't counted, so the risk shown is *smaller* than the real one | S1 quote + double upload in log · S2: MX$4,997 read vs MX$9,492 on screen | The promise is "the pesos you'd lose." Understating them is false certainty, the one thing the product must never do. |
| 2 | **Unknown store / missing rule:** "everything at risk" with nothing useful | S1: Amazon not in table, *"si me diera más información"* · S2: Zara app hides the store name, so an existing rule never fired | Without the rule, every answer is the same red number; the check stops being worth ten seconds. |
| 3 | **Language:** users translate the app themselves and the machine translation breaks key words | S2 screenshot: "tamaño" for "size" | Lowers trust and comprehension, but both users still understood the core message. |

## #1 fixed and redeployed (Nov 8) — before / after
- **Before (S2, live):** 3 items read → "MX$4,997 at risk," total MX$9,492, no warning, store unknown.
- **After (same cart, live, fictional replica):** one screenshot → "**Not read from your screenshot yet: MX$4,495**," headline note "part of your cart wasn't read," first flag "We read MX$4,997, but your screen shows a total of MX$9,492 → Add a screenshot of the rest of your cart," plus "We couldn't see the store's name → type it." Two screenshots selected at once → merged, overlapping line counted once, ZARA found, Zara's 30-day rule applied, nothing unread.
- Also fixed #2 partly (store prompt + Palacio rule) and found and fixed a merge bug in the live re-test ("M" vs "Talla M").

## The user who would come back
Session 2 answered *"Sí. Para saber sobre devolución y venta final confirmada."* She was invited back to try the multi-screenshot version. Proof of return: her reply and a new visit in the event log.
