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
bought before comes back in one tap with its store, priority and price.

## Operating Context

- Used in shops, often with no signal, often one-handed, often in a hurry.
- Shopping is continuous, not in trips: a few items on most days. The
  "New trip" button exists but has no use in this pattern (to be removed
  in v5.0, see IDEAS.md).
- Stores are typed freely (Metro, Plaza Vea, Wong, Sodimac …); Alex has
  15+ of them. Item names are Spanish or English.
- Currency is Peruvian soles, written `S/`.

## Capabilities and Constraints

- Priority: High / Medium / Low; Low is a parking bay ("not this trip").
- Stores tab regroups the same list by shop; inside a shop, optional
  grouping by aisle from a built-in ES/EN dictionary (no AI call).
- Optional prices and quantity; an optional budget bar. **Prices are
  estimates, not facts.** The budget stays as it is for now; its meaning
  is open for v5.0 (see IDEAS.md).
- Optional repeat reminders that flag an item as due; they never move it.
- Swipe left deletes any item, with Undo. Swipe right marks bought (to
  become an H/M/L picker in v5.0). Every gesture also has a visible
  button.
- Optional cloud backup (Supabase, email sign-in); the phone's copy is the
  live one.
- **Must keep:** works offline and free — no AI calls, no paid services,
  no keys in the public code. One-handed on iPhone: the thumb reaches what
  is used most. Items in Spanish and English, prices in S/; the app's own
  words stay English. Plain HTML/CSS/JS files on GitHub Pages, no build
  step (revisit only if it ever ships to strangers).
- Terminology: "High / Medium / Low", "In cart" (planned rename to
  "Bought"), "store" for a shop, "aisle" for a category inside one.

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
