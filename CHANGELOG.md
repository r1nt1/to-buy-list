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

## v2.2 — 2026-08-31

### Fixed

- **The app had stopped responding to taps entirely.** The coloured panel that
  slides out behind a row during a swipe was stretched across the whole row,
  and being invisible does not stop an element from receiving taps — so it was
  catching every one of them before the row underneath could. The panel is now
  marked as untouchable.
- **The phone was running an old version.** Browsers keep their own copy of
  `style.css` and `app.js` and reuse it rather than asking the server for a
  fresh one. The links in `index.html` now carry a `?v=` number which gets
  bumped every release, forcing a real download. This is why fixes appeared to
  do nothing on the iPhone.

### Changed

- **The "All items" tab is gone.** It was confusing and largely duplicated the
  add box, which already completes anything you have bought before.
- **The bottom bar now switches between Priority and Stores**, so the two
  arrangements of the list are thumb-reachable while shopping. The toggle that
  was at the top of the screen has been removed.
- **"Remove from this trip" added to the "i" sheet** — with All items gone,
  this is now how something leaves the list without being deleted.

---

## v2.1 — 2026-08-31

Feedback from actually using v2.0 on the phone.

### Added

- **Swipe right on a row to mark it bought.** A green panel slides out behind
  it saying what will happen; let go past about a third of the width and it
  fires. Swiping right on something already bought puts it back.
- **Swipe left to set the store.** Opens a picker listing every store you've
  typed before, plus a box for a new one and a "No store" button.
- Both gestures also still have ordinary buttons, so a gesture is never the
  only way to do something — and everything still works on the laptop.

### Fixed

- **The page no longer zooms in when you tap a field.** iPhone Safari zooms
  whenever you focus an input whose text is smaller than 16px. Two things
  were causing it: some fields were set to 15px and 14px, and — the real
  culprit — several `font:` lines were written in a form the browser rejects
  outright, so those inputs silently fell back to a 13px default. Every input
  in the app is now 16px or larger.

### Changed

- **The expanded row is one line of controls, not two.** 1 / 2 / 3, store and
  price now sit on a single row; the "i" moved up beside the name.
- **Group headings take their priority's colour** — "Must have" red, "Should
  get" amber, "Nice to have" grey.

### Still open

- What the **All items** tab is actually for. It's confusing as it stands and
  is under discussion — see the notes in the conversation.

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
