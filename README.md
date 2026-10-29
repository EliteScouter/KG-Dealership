# Dealer Wars

A used car dealership game for [Kaotic Gaming](https://kaotic.strictgaming.com), in the spirit of the
old Drug Wars: buy low, fix 'em up, sell high, and don't get caught owing Big Tony.

You start with $12,000, a gravel lot with 6 spaces, one salesman and two beaters. Buy cars at the
daily auction or from classified ads, recondition them, set your prices, and open for business:
customers walk the lot and buy, haggle, bring trade-ins, or walk away if you're too greedy. Grow into
an auto mall with a showroom, your own shop and detail bay, a finance office, billboards and a sales team.

High scores rank players by **money earned** (total profit on every car sold, plus branch income), then **cars sold**.

The end game: climb the reputation tiers (Shady lot to Legendary dealer), get invited to the twice-weekly
**VIP Invitational** to bid on Mythic cars (250 GTO, McLaren F1, Miura...) against billionaires, sell to
whale collectors and client requests, show your best car at the Friday **Concours d'Elegance**, open
**branch dealerships** for nightly income, run a **Certified Pre-Owned** program, and fill the trophy case.
Big lots get bulk tools: smart fix-up, detail/repair/repaint/inspect everything, set every price at once,
or auto-price each morning.

After that: build a **museum** and complete collection sets for nightly ticket money, fill **fleet
contracts**, track every model in the **collection book**, then **sell the company** for prestige stars,
spend them on permanent perks, and start a new dealership (the museum, book, trophies and high score
come with you).

## Play it

- On the site: <https://kaotic.strictgaming.com/play/dealer-wars> (saves to your Kaotic Gaming account).
- On its own: serve this folder with any static web server and open `index.html` (saves in the browser).

## Files

| File | What it is |
|---|---|
| `index.html` | The page. Loads the rest from `/play/dealer-wars/` on the site, or from `./` on its own. |
| `data.js` | The car list (real makes and models, rough current US values, rarity), upgrades, ads. |
| `sim.js` | The rules: car values, buyers, auctions, classifieds, repairs, loans, events. No screen code. |
| `ui.js` | The screen: the lot drawing, the business day, the side panel, saving. |
| `style.css` | The look. |
| `test.js` | Balance check: a bot plays 120 days several times (`node test.js`). Not loaded by the game. |

## How the economy works

- A car's value comes from its model's book value, year, miles, and its mechanical, body and detail
  condition (plus the market for its segment, which drifts and reacts to events). Collectibles don't
  lose value with age, and condition matters more for them.
- Buyers will pay roughly what a car **looks** worth (about 0.9 to 1.12 times, nudged by your salesman,
  reputation, showroom and finance office). Above that they haggle; far above it they leave.
  A $1,000 beater can't sell for $100k (`node test.js` checks this).
- Hidden problems lower a car's real mechanical condition without showing up until an inspection or a
  mechanical repair. Sell one unfixed and the buyer may come back for a refund, which also costs reputation.

## Changing it

Bump `ASSET_V` in `index.html` when you change the CSS or JS, so browsers fetch the new files.
Saves carry a version number (`SAVE_VERSION` in `sim.js`); if you change the save's shape, bump it
and handle older saves in `DW.ready`. The game's slug on the site is `dealer-wars`: don't change it,
since saves and high scores are stored under it.
