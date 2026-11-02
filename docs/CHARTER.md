# PRODUCT CHARTER — Before You Pay

*Written before the Week 12 rebuild. This is the referee for every scope fight from Week 12 to Week 17, including the ones I have with myself.*

**Founder:** Karom Asael González Martínez · Team 8 · Venture from Week 10 (the Regret vacuum)
**Engine sentence:** Step 5 of my Method becomes the function that turns the checkout screenshot a buyer already has into the pesos she would lose if it doesn't fit, under that store's real return rule, before she pays.

---

## VISION (3 years)

In three years, Before You Pay is the check every Mexican online shopper runs in the ten seconds before paying. It works inside the share sheet of any store, Instagram or TikTok checkout. It keeps a public, dated and correctable registry of the real return rules of the stores Mexicans actually buy from, built from the store's own words and from buyers' evidence. It never earns a peso from stores, so its most common honest answer can still be "wait." It starts with clothes, where the wrong size is the most common irreversible loss. Later it covers any purchase whose return rule is hidden behind the pay button.

## USERS (who, exactly)

- **Primary:** an adult in Mexico buying clothes or shoes online from a phone, **about to pay right now**, with a guessed size, often using a discount code or a "last units" offer, who has never read the store's return policy. Two formal personas live in [`PERSONAS.md`](PERSONAS.md): Rocío (51) and Diego (21).
- **Not the user:** stores, brands, marketplaces, stylists or anyone selling something. They never get access to a buyer's data and never pay to appear.

## PRINCIPLES (rules the product never breaks)

1. **The AI reads; rules decide.** The vision model only extracts what is visible on the screenshot. Money at risk, the return rule and every flag come from deterministic, tested code and a curated policy table, never from the model's opinion.
2. **Unknown stays unknown.** If the store's own text doesn't say a discounted item can be returned, the money counts as *at risk*, never as protected. Every return rule shows its source and the date it was checked. The product never says "safe," "you can return it" or "it will fit."
3. **Nobody on the store side pays.** No affiliate links, no sponsored stores, no product recommendations, no ads, no data sales. (This is Team 8's shadow clause.)
4. **Store the minimum.** The screenshot image is never saved. A saved check holds only item names, sizes, prices, the result and the buyer's decision, behind Google sign-in and row-level security. The buyer can delete any check.
5. **Every warning ends in one next step** the buyer can do right now (Team 8's Condition 5).

## NON-GOALS (what it will NEVER do)

- Recommend a product, a store, a size to buy, or "similar items."
- Place an order, store a card, or connect to a store account.
- Predict fit ("this will fit you"). Fit stays the buyer's call.
- Ask for body photos or body measurements.
- Save the screenshot image itself.
- Take money, data deals or placement fees from stores, brands or marketplaces.
- Mark a store's return rule as verified when it is only the store's advertised wording.

## NORTH STAR

**Pesos kept:** the sum of *money at risk* on saved checks where the buyer chose **"I'll wait"** or **"I'll change the size first."** If this number grows, the product is doing its job. If it doesn't, it's just a calculator.

## CORE CONCEPTS (the product's nouns)

| Noun | One-line definition |
|---|---|
| **Check** | One run of the product on one checkout, with its result and the buyer's decision. |
| **Checkout screenshot** | The image the buyer already has of the cart or payment screen. It is the only input, and it is never stored. |
| **Line item** | One product row read from the screenshot: name, size, unit price paid, list price, quantity. Every field is editable. |
| **Return rule** | What a store's own text says about returning regular and discounted items, with its source, check date and status (advertised / unverified). |
| **Money at risk** | Pesos the buyer could not get back if the size fails: items confirmed non-returnable plus items whose return isn't confirmed. |
| **Pressure flag** | Something on the checkout pushing a fast decision: a discount code, "last units," a countdown, or duplicates in the cart. |
| **Next step** | The one concrete action attached to every flag ("Check the size chart in centimeters before paying"). |
| **Decision** | What the buyer chose: wait, change the size first, or buy anyway (my call). The product records it and never makes it. |

*If a feature doesn't speak these nouns, it doesn't belong.*
