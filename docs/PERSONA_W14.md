# PERSONA TEST (Layer 1) — Week 14, the price meets a buyer

**Synthetic user, from [`PERSONAS.md`](PERSONAS.md):** *"You are Rocío, 51, from Chalco. You buy clothes for your family on your phone. You read slowly, you don't trust new apps, and you quit silently the moment you feel lost or think someone wants your data or your money."*
She is Segment 2 (buys for several people), the hardest buyer for a price: she distrusts paying an app at all.

**Walkthrough:** production build at phone size (390 px), fictional cart *Moda Norte (fictional)*, MX$2,298. The screenshot reader and the code check answered with labeled fixtures so the test could run offline; everything else is the real code. Screens in order:

| # | Screen | Rocío, out loud | Confusion logged |
|---|---|---|---|
| 1 | Check page, first visit | "Una revisión gratis al mes. Ok, no me piden cuenta." | None. "1 full check a month is free" is in green under the title. |
| 2 | First check (free) | "MX$2,298 en riesgo… y abajo dice que ya usé la gratis." | Minor: the "used" line is small and grey under the upload box. |
| 3 | Second cart → the gate | "¿Código? ¿Qué código? ¿De dónde lo saco? … Mejor lo dejo." | **Worst.** The gate asked for a code and never said how a code is obtained. She stops here, before reaching the price. |
| 4 | Typed a code with a zero | "Dice que no parece código. Ni sé cuál es." | Clear message, but it only helps someone who already has a code. |
| 5 | Pricing: what you do today | "Adivinar la talla, sí, eso hago. Comprar dos tallas… a veces." | None. She recognizes herself in the first card. |
| 6 | Pricing: plans | "¿Segment 1, sale-season? No entiendo eso. 'Buys for several people'… esa soy yo." | Jargon in the plan labels; she found hers by the second line. |
| 7 | Request the pack (signed out) | "¿Entrar con Google? ¿Para qué quieren mi correo? … Ah, el pago es por transferencia, no aquí." | Hesitation at sign-in, eased by "never on this site." Logged. |
| 8 | What payers actually did | "Uno dijo que sí y nadie ha pagado. Bueno, por lo menos no mienten." | None. The honesty reads as trust, not as weakness. |
| 9 | Code accepted | "Pack: 4 checks left… ¿ya está activo?" | Minor: the confirmation was grey and easy to miss. |
| 10 | Paid check | "Lo mismo que la gratis. Ahora me quedan 3." | None. Same answer, one fewer check, as designed. |
| 11–12 | Simulator, 10:1 memo | "Esto es para otra gente." *(skims)* | Expected: these pages are for the course and for payers who want the math, not for her checkout. |

**Fixed before the deadline (worst confusion, screen 3):** the gate now lists how a code is obtained: *1) Choose a plan and tap "Request." 2) Pay the founder by bank transfer or cash; nothing is charged on this site. 3) You get a code by message; enter it here.* Same deploy: an active code now shows in green ("Code active. Pack: 4 checks left."), and the plan labels say *"for when you buy in sales"* and *"you buy a lot, or for your family."* Before/after: `gate_compare.png` in the Week 14 evidence.

**Logged, not fixed:** Google sign-in still feels like a data grab to a distrustful buyer. Next: allow a request with only a WhatsApp number and no account, which needs its own abuse limit first. Spanish UI is still pending (Week 13 pain #3).

*Layer 1 caveat:* a simulated buyer tests whether the price can be understood, not whether anyone pays. Paying is what the five real offers measure.
