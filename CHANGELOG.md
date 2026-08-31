# Changelog

A running record of how this app started and how it's going.
Newest at the top. Written to be readable, not technical.

## How the numbering works

Versions look like **2.0** — a big number and a small number.

- The **big number** changes when the app works differently in a way you'd
  notice immediately, or when the shape of your saved data changes.
  Going 1.x → 2.0 means "this is a different app than before."
- The **small number** changes for everything else: a new button, a fix,
  a colour, a tweak. 2.0 → 2.1 → 2.2.

The version currently running is shown at the bottom of the **All items** tab,
so you can always tell which one is on your phone.

---

## v2.0 — 2026-08-31

The first real redesign, after talking through how Apple Reminders actually
behaves and deciding which parts were worth borrowing.

### Added

- **Tap a row and it expands in place.** The name becomes editable right there
  and the controls appear underneath it. No more full-screen box covering
  everything — copied from how Reminders selects an item.
- **Priority buttons 1 / 2 / 3**, shown only while a row is open, so they don't
  clutter the list while you're reading it. A newly added item opens
  automatically, ready to be prioritized.
- **Stores.** Free text — type "Metro" or "Plaza Vea" and the app remembers it,
  then suggests it next time you start typing, the way Excel completes a word
  you've used before.
- **A `By priority | By store` toggle** at the top of the trip. Same items,
  two arrangements: priority for deciding at home what fits the budget, store
  for shopping once you're out.
- **Collapsible store groups.** Tap a store heading to fold it away, so when
  you're standing in one shop the others take up no space at all.
- **An "Other" group** for items you haven't given a store yet.
- **Notes**, behind the "i" button — "the big bag, not the small one".
- **The budget block hides itself** until at least one item has a price, and
  can be collapsed to a single line by tapping it. The app is useful from the
  first item; it doesn't demand prices before it does anything.

### Changed

- **"Pantry" is now "All items".** The old name assumed you knew what a pantry
  was, which is a bad thing for a label to assume.
- **Stores replaced categories.** Produce / Meat / Frozen is Apple's idea of
  how to organize food. Where you actually buy something is more useful, and
  no other app does it.
- **Priorities are numbers, not words.** Must / Should / Nice-to-have became
  1 / 2 / 3. The wordy versions survive as the group headings.
- **Priority colours are red / amber / grey**, not red / orange / yellow.
  Three warm colours made everything look urgent, so nothing did — and pale
  yellow on white is close to unreadable.
- **Currency is now S/ instead of $.** To change it, edit the line near the
  top of `app.js` that says `const CURRENCY = 'S/';`

### Under the hood

- Old v1 data is carried forward automatically rather than wiped. Since
  categories no longer exist, any category you'd set is preserved as a note
  so nothing you typed is silently lost.

### Known limitations

- Swipe gestures and long-press aren't built yet. Deliberately: structure
  first, gestures once the app is full of your real groceries.
- No icon, no offline support, not published. Still runs only while the
  Mac serves it.

---

## v1.0 — 2026-08-22

The first working version, built to have something real to react to.

### Added

- **The core idea: Pantry and Trip.** Checking an item off completes it for
  this trip only — it is never deleted, and comes back next week. This is the
  one thing Apple Reminders can't do, and it's why the app exists.
- A tappable priority chip that cycled Must → Should → Maybe.
- Optional prices, a running cart total, and a **"budget runs out here"** line
  drawn across the list at the point the cart would go over budget.
- **Finish trip**, which clears the list and records what was bought, so the
  most-bought items surface as "usual suspects" for one-tap re-adding.
- Everything saved on the device, no accounts, no server.

### Fixed during the build

- The budget line printed twice, with an empty box between the copies.
- Dates were stamped a day ahead — the code used UTC, which is already
  tomorrow during the evening in Peru.
- The edit box overflowed its own edges and clipped the Save button, because
  a text input won't shrink below its default width unless told to.
