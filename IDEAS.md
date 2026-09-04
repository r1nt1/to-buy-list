# Ideas parked, and things decided against

## Parked (not built yet)
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

## Still open
Alex has more modifications and questions queued. `main` = v3.3, branch
`v4` = v4.0; nothing pushed yet. Next: merge, set `?v=` back to `4.0`, push
(ask first).
