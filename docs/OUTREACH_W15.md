# OUTREACH — Week 15 (distribution log)

*Blueprint declaration: send dated, sourced examples to opted-in buyers in manageable batches and log actual next actions (Conditions 2, 3, 5). Roles, never names. Messages are written in Spanish because that's the language these buyers use on WhatsApp; each one has an English translation below it. The pieces themselves are in English, on beforeyoupay.xyz/rules.*

## Rules for every batch

1. **Permission first.** The first message only asks. No piece goes to anyone who said no or didn't reply.
2. **One batch = up to 5 people, the same wording.** So pieces and channels can be compared like for like.
3. **Never message twice without a reply.** Silence is logged as silence, not chased.
4. **What counts (Condition 3):** a check started, a store requested, a share, or a purchase. Praise ("qué buena idea") is logged but never counted as demand.
5. **Capacity:** I answer every reply the same day; up to 10 new stores a week.

## Batch 1 · the four people from the Buen Fin offers

The people who answered the Week 14 pack offer and didn't say no: the classmate who paid MX$60 and the three who said yes without paying. The fifth person said no (he buys in physical stores), so he isn't messaged again.

**Message 1, permission (everyone in the batch):**

> Hola, soy Asael 👋 ¿Te acuerdas de Before You Pay, lo de revisar el carrito antes de pagar? Estoy publicando las reglas de devolución de las tiendas, con fecha y fuente. ¿Te puedo mandar dos: la de Zara y una de qué hacer si te llega algo de otra talla? Si no contestas, no te vuelvo a escribir.

*English:* "Hi, it's Asael 👋 Remember Before You Pay, the cart check before paying? I'm publishing stores' return rules, with date and source. Can I send you two: Zara's, and one on what to do if something arrives in the wrong size? If you don't answer, I won't write again."

**Message 2, only after a yes (piece S1-1, image card + link):**

> Va. Zara México da 30 días desde el envío para devolver compras en línea (gratis en tienda o $69 en punto de entrega). De los artículos con descuento su página no dice nada, así que yo lo cuento como riesgo. Lo revisé el 22 de noviembre: https://beforeyoupay.xyz/rules?src=wa&p=zara#zara

*English:* "OK. Zara México gives 30 days from shipping to return online orders (free in store or MX$69 at a drop-off point). Its page says nothing about discounted items, so I count them as risk. I checked it on November 22: (link)." *Attach:* `zara-card.png`.

**Message 3, right after (piece S3-1, the text message itself + link):**

> Y esta, por si algún día te llega de otra talla 👇
>
> *(the S3-1 text from /rules, copied with its "Copy message" button)*

*English:* "And this one, in case something ever arrives in the wrong size 👇"

## What I expect (written before sending)

- Permission: **3 of 4 say yes** (the payer for sure); one doesn't reply.
- Opens: **2 of 3** open the link (visible in the anonymous log as `src=wa`).
- Meaningful action: **1 store request** (a store they actually buy from), **0–1 checks** (Buen Fin is over; few carts are open right now).
- The most common reply will be praise. It's logged, not counted.

## Log

| # | Role (no names) | Relation | Permission | Pieces sent | Date | What they said (short) | Action | Counts? |
|---|---|---|---|---|---|---|---|---|
| 1 | Classmate who paid MX$60 in Buen Fin | Known (school) | **Yes**, 14 min after the ask | Zara card (image + link), Your five days (link) | Nov 22 | "It's happened to me many times that I can't return something and the money is stuck." After the pieces: "With this I won't keep losing money." | **Opened both** on his phone, Zara first, five-days 12 s later, about 3 min after replying. No check, no store request, no share (yet). | Permission + 2 opens count. The praise and "won't keep losing money" don't (and the second one reads the desk as a guarantee it never makes). |
| 2 | Buen Fin "yes", no payment | Known (WhatsApp contact) | **Yes**, 1 min after the ask | Zara card (image + link), Your five days (link) | Nov 22 | "Do I have to open it now? I have no internet, only a data plan for social apps." After I said "preferably yes", he got data shared to him: "I opened it and skimmed it." | **Opened both** on his phone, Zara first, five-days 15 s later. No check, no store request, no share (yet). | Permission + 2 opens count, but **nudged**: my "preferably yes" pushed him, so this open isn't spontaneous. Finding: a social-only data plan can't open links outside WhatsApp, so the image and message text must carry the whole rule. |
| 3 | Buen Fin "yes", no payment | Known (WhatsApp contact) | | | | | | |
| 4 | Buen Fin "yes", no payment | Known (WhatsApp contact) | | | | | | |

**Anonymous site log for `src=wa`** (from `byp_content_events`, filled in after the batch): page views · piece opens · checks started · stores requested · shares.

- Excluded as the founder's own clicks: visits `84uf6leg5k` and `dohfqyitp5` (desktop, Nov 22 15:56 local; I opened the links from WhatsApp on my Mac). Evidence: `docs/w15/wa_query_1_founder_clicks.png`.
- Person 2: visits `fkgfv7zujf` (zara) and `cmxgemuum…` (five-days, id cut off in the dashboard), phone, Nov 22 16:06 local. Evidence: `docs/w15/wa_query_3.png`, replies in `docs/w15/outreach_reply_2.png` and `outreach_reply_2b.png`.
- Person 1: visits `ltgvux6jcx` (zara) and `3087ufu2lt` (five-days), phone, Nov 22 15:58 local. Evidence: `docs/w15/wa_query_2.png`, replies in `docs/w15/outreach_reply_1.png` and `outreach_reply_1b.png`.
