# PERSONA TEST (Layer 1) — Week 13, after fix #1

**Synthetic user, built from this week's real sessions:** *Mariana, 24, buys clothes on the Zara app on her phone, carts of 4–6 items, uses Safari's translate on English sites, skims, and stops reading once she thinks she has the answer.*

**Walkthrough** (live site, phone viewport 375 px, fictional replica of session 2's cart: three items visible, MX$9,492 total):

| Screen | Mariana, out loud | Confusion logged |
|---|---|---|
| 1. Upload box | "Ok, sube captura… 'Long cart? Select up to 4' — ah, puedo subir varias. Mi carrito tiene seis cosas, subo dos." | None. The new line answers session 1's complaint before she hits it. |
| 2. Result, one screenshot | "MX$4,997 en riesgo. Ok, ya sé cuánto." *(stops at the big red number)* | **Worst:** the headline still reads as the final answer. The amber row "Not read from your screenshot yet: MX$4,495" sits three lines below, where a skimmer has already stopped. |
| 3. Flags | "'We read MX$4,997 but your screen shows MX$9,492'… ah, no leyó todo." | Clear once she reaches it. |
| 4. "We couldn't see the store's name" | "¿Dónde la escribo? Dice 'What we read' abajo… tengo que bajar mucho." | Minor: the field is far below, inside a collapsed section. |
| 5. + Add another screenshot | "Subo la otra… ya cuadra, ya dice Zara y 30 días." | None. |
| 6. Translation | "Tamaño… ¿qué tamaño?" | Logged as pain #3 (language), not fixed this week. |

**Fixed before the deadline (worst confusion):** when part of the cart is unread, the headline now carries an amber line right under the number: *"So far: part of your cart wasn't read, so the real number may be higher."* The answer can't be mistaken for the final one anymore.

**Logged, not fixed:** the store-name field is far below the prompt (next: an inline store field inside the flag); Spanish UI (next week).

*Layer 1 caveat:* a simulated user is more patient than a real one, so this confirms comprehension, not demand.
