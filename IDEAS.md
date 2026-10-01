# Ideas parked, and things decided against

## Planned for v5.0 (agreed 2026-09-30, details after the Impeccable critique)
Alex doesn't shop in trips: he buys a few things most days, so the list
never ends. New trip has no use for him, and it would put bought things
(diapers, just bought) back into High.
- **"In cart" becomes "Bought"** — "In cart" sounds like something you're
  about to pay for. Collapsed by default, newest first, each row dated
  (*Diapers · 3 days ago*). It never needs clearing: it already works as
  the memory of everything bought — open it and tap, or type the name in
  the add box and the same item comes back with its store, priority and
  price. Other names considered: Recently bought (implies items drop off),
  History (sounds rarely opened), Got it (vague).
- **Ticking records the purchase** (lastBought, timesBought) at once, not
  at New trip — so "bought 3 days ago" and reminders become true.
- **New trip goes.** Nothing replaces it.
- **Swipe right = H/M/L picker.** The row slides aside to show H, M, L
  (current one lit); tap one. Fixes "move up one" doing nothing on High
  and taking two swipes from Low. Not the rejected progressive swipe: you
  tap a button, distance picks nothing. H/M/L stays in the open row too —
  swipes are invisible, every gesture keeps a visible button.
- **Lucide icons** for the Priority and Stores tabs, and a Lucide icon as
  the logo for now (ISC licence: free, keep the notice).
- **Stores tab stays as it is** — 15+ stores, collapsed by default;
  collapsing the greyed bought items too would be a second tap.

## The budget and prices (open, 2026-09-30)
Kept as it is for now. It's for people who count every cent — Alex once
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
  (that stays "which arrangement am I looking at").
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
- **Reminders that move items** — they flag only. One picker, not pills.
- **Stores/qty/price in the i sheet** — row only; two places was one too many.
- **AI call for aisles** — dictionary instead: offline, free, no key in a
  public repo.
- **Capitalised store names** — stored lowercase, styled capitalised.
- **A priority lit by default in the add row** — would offer to demote an
  existing High item; unlit = "haven't said".
- **Fourth "none" priority** — Low already means "not this trip".
- **Progressive swipe** (distance picks priority) — needs precision, no haptics.

## Rule relaxed
- "The item never moves when opened" — held from v2.0 to v4.2. Relaxed on
  2026-09-04 for the *vertical* only: the open row drops the check circle and
  gets 15 px top/bottom, so the name shifts down a little. Horizontal
  position is still exact (no circle = name box starts at the row edge).

## Still open
v4.3.2 is live (2026-09-29). v4.4 in progress: swipe left = delete with
undo, H/M/L to the right of the open row (one-handed use), palette B, then
an Impeccable critique of the whole app. v5.0 after that (above).
