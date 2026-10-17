# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Alex first, then people like him.** Alex lives in Lima and buys a few
things most days rather than doing weekly trips — diapers one day, yogurt
another, bread another — so the list never ends. He uses it on an iPhone,
added to the Home Screen, often one-handed, often standing in a shop. His
brother tries it. Later, possibly strangers, including people on a tight
budget for whom every cent counts (Alex has been there).

The job: glance at the list and see only what still needs buying, most
important first, without being distracted by what was just bought.

## Product Purpose

A shopping list where checking something off never deletes it. Bought
things step aside and the list keeps only what's still needed, sorted
High / Medium / Low. Success: Alex opens it, sees "no bread, no yogurt",
buys them, and the list is right again — with no housekeeping.

## Positioning

**A list that never empties.** Most list apps treat an item as a one-off
task that disappears when done. Here every item is permanent: the list is a
standing record of what you buy, sorted by what matters, and anything
bought before comes back in one tap with its store and priority.

## Operating Context

- Used in shops, often with no signal, often one-handed, often in a hurry.
- Shopping is continuous, not in trips: a few items on most days. So
  there is no "New trip" (removed in v5.0): ticking records the purchase,
  and bought things wait in Bought until needed again.
- Stores are typed freely (Metro, Plaza Vea, Wong, Sodimac …); Alex has
  15+ of them. Item names are Spanish or English.
- Currency is Peruvian soles, written `S/`.

## Capabilities and Constraints

- Priority: High / Medium / Low; Low is a parking bay ("not this trip").
- Three tabs: Priority; Stores regroups the same list by shop; Aisles by
  aisle, from a built-in ES/EN dictionary (no AI call).
- No prices, quantities or budget (removed in v5.1 to keep it simple;
  a quantity goes in the name, "Eggs 4"). Prices may return one day as
  a spending record — see IDEAS.md.
- Optional repeat reminders that flag an item as due; they never move it.
- Swipe left deletes any item, with Undo. Swipe right uncovers an H/M/L
  picker. Every gesture also has a visible button. Opening a row never
  moves the list: its controls float over it.
- Optional cloud backup (Supabase, email sign-in); the phone's copy is the
  live one.
- **Must keep:** works offline and free — no AI calls, no paid services,
  no keys in the public code. One-handed on iPhone: the thumb reaches what
  is used most. Items in Spanish and English; the app's own
  words stay English. Plain HTML/CSS/JS files on GitHub Pages, no build
  step (revisit only if it ever ships to strangers).
- Terminology: "High / Medium / Low", "Bought" (was "In cart" until
  v5.0), "store" for a shop, "aisle" for a category inside one.

## Brand Commitments

- Name: **To buy list**.
- In Alex's words: **easy to use, clean, minimal.**
- Logo: a placeholder today; a Lucide icon is planned for v5.0 (Alex may
  design his own later). Tab icons from Lucide.

## Evidence on Hand

- Alex's own daily use is the only usage evidence. No other users,
  testimonials, metrics or research results exist — do not invent any.
- `?demo=1` loads a 20-item sample list (never saved) for showing the app.
- RESEARCH-BRIEF.md holds questions for competitor research; no answers
  are recorded.

## Product Principles

1. **Show what's still needed, nothing else.** Bought things step aside;
   they don't come back on their own.
2. **No housekeeping.** No step the user must remember to do for the list
   to stay right (why New trip goes).
3. **Thumb first.** The most-used controls sit where a right thumb reaches.
4. **Every gesture has a visible button.** Swipes are shortcuts, never the
   only way.
5. **Simple over clever.** Easy to use, clean, minimal — remove before
   adding.
