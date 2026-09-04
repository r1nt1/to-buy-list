# Ideas parked, and things decided against

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
Alex has more modifications and questions queued. `main` = v3.3, branch
`v4` = v4.0; nothing pushed yet. Next: merge, set `?v=` back to `4.0`, push
(ask first).
