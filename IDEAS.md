# Ideas parked, and things decided against

## v5.1 — agreed 2026-10-16 (v5.0 went live the same day)
Alex: keep the look (palette C) and get the app working the way he wants
first; the new aesthetic comes after.
- **Low and Bought start collapsed**, and remember what you last did
  (open one and it stays open next time).
- **Due items first** within their own section (they still never change
  section).
- **Bought: newest first, each row dated** (*Diapers · 3 days ago*). It is
  the memory of everything bought: tap it, or type the name, to bring it back.
- **No prices, no quantities, no budget** — keep it simple. The price box,
  the quantity stepper, the budget bar and the section totals all go, and
  the stored prices, quantities and budget amount are deleted from saved
  data (Alex's choice: not kept hidden). Need four? Type it in the name:
  "Eggs 4" or "Eggs x4". Prices may come back one day (see below).
- **Add box: one line under it** — H/M/L on the left, stores on the right
  (under the thumb: priority is mostly set by swiping now). The green Add
  button becomes "+". The open row uses the same line.
- **Swipe right = H/M/L picker**: the row slides aside to show H, M, L
  (current one lit); tap one. Ticking is the check circle only. On a
  Bought row, picking a priority brings it back into that section.
- **The open row covers the list instead of pushing it down** — nothing
  below moves when you tap an item (the old "item never moves" rule, back).
- **Three tabs: Priority, Stores, Aisles.** Aisles groups the whole list by
  aisle across every shop. Store and aisle headings in the normal text
  colour (they were Medium's grey). The "Group by aisle" switch inside
  Stores goes — the Aisles tab replaces it.
- **Lucide icons** (free, ISC licence — keep the notice) for the tabs, the
  logo and the small controls.
- **Less space between the title and the add box.**

## A menu instead of the lone cloud icon (idea, 2026-10-16)
The cloud icon floats alone top right. Replace it with a menu button
(hamburger or similar); inside: **backup** (the cloud, moved here),
**profile**, **stats** (times bought, by item and by aisle/department —
timesBought and lastBought are already recorded), **delete account**.
Later — not part of v5.1.

## Light / Dark / Auto, then custom looks (idea, 2026-10-17)
Today the app simply follows the phone's own light or dark setting. Alex
would like a manual switch with three choices: **Light**, **Dark** and
**Auto** (follow the phone, the default). It belongs in the settings menu
above. Later, the same switch could offer **custom looks**: the palettes
A and B recorded under "Let the user choose the theme" below, and the
**yellow notepad** design that was left behind (mockups in
~/Developer/artifacts/to-buy-list-mockups/yellow-pad-v2/).

## The budget and prices (REMOVED in v5.1, 2026-10-16 — notes kept for if they return)
Was kept as it was until v5.0. It's for people who count every cent — Alex once
did. He doesn't type prices so the bar stays hidden, which costs him
section totals; an opt-in setting is the fix if that bothers him.
**Working rule: prices are estimates, not facts** — the app remembers the
last price; edit it only when it surprises you. The budget answers "will
this roughly fit?". The real problem is for v5.0: with Bought never
emptying, "in cart" grows forever, so the budget needs a new meaning
(spent this week/month, from the purchase dates). Options, simplest first:
1. Estimates (above). 2. A price per shop (avocados Metro S/3, Wong S/5) —
accurate but more typing. 3. Confirm the price when ticking — the moment
you know what you paid; optional. 4. **Receipt photo** — reads prices off
the receipt. A whole project: needs an AI/OCR service (cost, a key that
can't live in public code → a small server), only works online, and
Peruvian receipts abbreviate ("PALTA FTE KG") so matching often fails.
Parked.

## Spending instead of a budget? (open, 2026-10-01)
Alex is leaning towards **removing the budget**: it takes space, needs
re-setting daily/weekly/monthly, and only works if every item has an
up-to-date price — a hassle for a shopping list. In its place, a
**spending record**: every tick of an item that has a price is logged
(date, item, price × qty). The app then shows spent this week / month, by
department, and tapping a department lists its items (e.g. "bread: S/48
this month"). Prices stay estimates; logging needs no extra step. Cost:
medium — a purchase log in the saved data (small, backed up with the
rest), a spending screen, and departments (see below).

## A family monthly budget app (parked, 2026-10-01)
The bigger idea: To buy list becomes one part of a family's monthly
budget. Departments like **health, clothes, services, groceries**, each
with its own budget; groceries is the list being built now. There a
budget makes far more sense — people already think in monthly amounts per
area, so they're willing to type prices.
- **Bills** (water, light, internet …) belong here: fixed due dates, an
  amount, a "paid" state — a different kind of item from shopping (which
  has "bought N days ago"). Probably needs a new name for the app.
- **Departments vs aisles:** aisles (Produce, Dairy …) sort things inside
  groceries; departments (health, clothes, services, groceries) sort
  spending. The aisle dictionary could map aisles → departments.
- Revisit after v5.0.

## Parked (not built yet)
- **Push notifications for reminders** (asked 2026-09-03). Possible on iPhone
  for a Home Screen app since iOS 16.4, but it needs three new pieces: a
  manifest + service worker (makes it a proper PWA), the user granting
  permission, and *a server that sends the push* — the phone can't schedule
  its own. Cheapest server: a GitHub Actions cron once a day that reads due
  items from Supabase and sends Web Push (VAPID keys). Only works for
  signed-in users, since the list must be in the cloud to be read.
- **Let the user choose the theme** (2026-09-03). Three palettes were tried on
  2026-09-03 and **C is the default**; A and B are only recorded here. A
  picker in a future settings menu would bring them back as a choice. Values, dark mode first, light in brackets:

  | | High | Medium | Low | Accent (Add, cart) | Remind | Warn | Over/Delete |
  |---|---|---|---|---|---|---|---|
  | **A** reserve the red | `#FFB224` (`#D98A00`) | `#C08A3E` (`#9A6A25`) | `#6E7681` | `#3FB68B` (`#1E9A72`) | `#8E8BFF` (`#5B57D6`) | `#FFB224` (`#B8860B`) | `#E5484D` (`#D7263D`) |
  | **B** warm ramp | `#FF7A5C` (`#E2542F`) | `#EFC05C` (`#B8860B`) | `#7B8794` | `#4FC3E8` (`#1A8FB5`) | `#A98BFF` (`#6B4FD6`) | `#EFC05C` (`#C9971A`) | `#E04A50` (`#C62F35`) |
  | **C** priority by brightness | `#E6E9EC` (`#14181D`) | `#8D959E` (`#6B7280`) | `#4A5158` (`#B6BCC4`) | `#5BD9A6` (`#1F9D6F`) | `#6EA8FE` (`#2F6DF6`) | `#EFC05C` (`#B8860B`) | `#F05A5A` (`#D7263D`) |

  Surfaces are shared by all three (dark `#111418` / `#1B1F25`, light
  `#F6F7F9` / `#FFFFFF`). Colour-blindness: C is safest — priority never
  depends on hue, and every other colour sits next to a word.
- **Stats** — timesBought/lastBought are already recorded, just not shown.
  "Popcorn × 14 this year" needs no new plumbing. Easy first win.
- **Profile/settings menu** — a small header button, not the bottom bar
  (that stays "which arrangement am I looking at"). Fleshed out above
  (2026-10-16).
- **Sharing to social** — serves attracting *other* users, not weekly use;
  revisit once the daily version is finished.
- **Sync across devices** — direction agreed: managed backend (Supabase).
  Offline editing is the hard part, not login. Means one row per item.
- **Drag to reorder** — expensive on the web (long-press, auto-scroll, no
  haptics) and mostly duplicates open-row → H/M/L. If ordering *within* a
  group ever matters, a sort option is far cheaper.

## Decided against — don't re-propose without a new argument
- **An "In cart" section on the Stores tab** — removed 2026-09-04. Bought
  items stay under their shop, greyed; store totals include them (spend per
  shop). Priority tab keeps In cart, because that is where the budget lives.
- **Underlined fields in the open row** — tried in v4.0–4.2, looked
  unfinished; boxes like the add panel instead. **Stores carrying over** to
  the next added item — reverted 2026-09-04, wrong shop landed on things.
- **Aisles in the priority list.** Built, compared on a real list: a dozen
  groups of one. Walking order only matters standing in a shop → Stores tab
  only. (Store = *where*, tagged by you; aisle = *what*, from the dictionary;
  independent, so the app never needs a shop's inventory.)
- **The "budget runs out here" line.** Alphabetical order within a section
  cut through wanted items. The top bar (amber ≥80 %, red when over) replaces it.
- **Whole-list total** — counts Low, the parking bay; headings total each tier.
- **Reminders that move items to another section** — they flag only. One
  picker, not pills. (Relaxed 2026-10-01: due items may sort first
  *within* their section.)
- **Stores/qty/price in the i sheet** — row only; two places was one too many.
- **AI call for aisles** — dictionary instead: offline, free, no key in a
  public repo.
- **Capitalised store names** — stored lowercase, styled capitalised.
- **A priority lit by default in the add row** — would offer to demote an
  existing High item; unlit = "haven't said".
- **Fourth "none" priority** — Low already means "not this trip".
- **Progressive swipe** (distance picks priority) — needs precision, no haptics.

## Rule relaxed, then restored
- "The item never moves when opened" — held from v2.0 to v4.2. Relaxed on
  2026-09-04 for the *vertical* only: the open row drops the check circle and
  gets 15 px top/bottom, so the name shifts down a little. **Restored in
  v5.1** (Alex, 2026-10-16): the row keeps its height and its controls float
  over the list below, so nothing moves.

## Still open
v5.0 is live (2026-10-16), palette C. v5.1 in progress (above). The new
look (yellow pad v2 and others, mockups in ~/Developer/artifacts) waits
until the app works the way Alex wants.
