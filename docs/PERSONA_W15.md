# PERSONA TEST — Week 15 (Diego, 21)

*Layer 1 testing: a synthetic user built from my User research, walked through the live product screen by screen before a real buyer sees it. Persona from [`PERSONAS.md`](PERSONAS.md), adapted to this week's moment (the regret, not the cart).*

## Who the synthetic user was

> *"You are Diego, 21, a student in CDMX. Two days ago your Buen Fin order from Zara arrived: a jacket you bought with a discount code, one size too big. A classmate sends you a link on WhatsApp: beforeyoupay.xyz/rules?src=wa&p=zara. You're on your phone, you skim, and you abandon anything that takes more than half a minute. Narrate out loud where you hesitate, what you don't understand and where you'd quit."*

**Task:** find out what you can do about the jacket now, and what to do next time.

## The walkthrough (live site, Nov 22, 2026, phone width)

| # | Screen | Diego, out loud | Severity |
|---|---|---|---|
| 1 | Lands on the **Zara México** card (the link scrolls straight to it). | "OK, Zara: 30 days. *Discounted items: the page doesn't say.* So… can I return mine or not? The next step says *before paying for a sale item, check your cart*. I already paid. This doesn't tell me anything about my jacket." **He scrolls, sees a grey sketch (Palacio) and then a video, and says he'd close the tab.** | **Worst: he quits. A buyer at the regret moment has no path from a store's rule to what he can do now.** |
| 2 | **Cart autopsy** video (28 s). | "I'm not watching a 28-second video about a fake cart." Skips it; reads the red *MX$6,565* under it. | Medium: the video works for the next cart, not for the regret. |
| 3 | **Your five days** (only if he gets there). | "Five business days after delivery. Mine arrived Thursday… do Saturdays count?" Reads the first lines of the message, skips the rest. | Low: the answer is the S3-2 sketch ("Counting the five business days"), so that sketch goes next. |
| 4 | **Ask for your store's rule.** | "If I type Liverpool, how do I find out? There's no email." | Low, by design: no contact data is collected. The page says the store appears on this page once it's read. |
| 5 | Header. | "*Check* is bold. Am I on the checker?" | Low, cosmetic. |

## What I fixed (the worst one) and redeployed

1. **A path from every store card to the five days.** Under the next step, every store card now says *"Already paid and it doesn't fit? See your five days after delivery ↓"* and jumps to the five-days piece.
2. **The series order follows the moments.** *Your five days* now sits right after the stores, before the cart autopsy: the regret comes first, the next cart second.

**Re-run of step 1:** Diego lands on Zara, reads *the page doesn't say*, taps the amber line and lands on *It arrived too big* in one tap: "OK, five business days, tell them in writing, keep the screenshot. That I can do today."

**Logged, not fixed this week:** the video is for the next cart (kept, now below the five days); the business-days question becomes the next five-days piece; no notification for store requests (on purpose: no contact data); the header's bold *Check* (cosmetic).

## Evidence

- Before: `docs/w15/persona_before.png` (lands on Zara; next step only for people who haven't paid).
- After: `docs/w15/persona_after.png` (the amber *Already paid?* line under the next step).
