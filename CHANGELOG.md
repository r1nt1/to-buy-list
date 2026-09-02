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

## v4.0 — 2026-09-02

The big number changed because the shape of your saved data changed: an item
used to have *a* store, and now it has a list of them. Existing items are
carried over automatically the first time this version loads — `Metro`
becomes a one-item list — so nothing you typed is lost.

### Added

- **An item can be sold in more than one shop.** Rice at both Metro and Plaza
  Vea is one item tagged with both, not two items. The store box is now a row
  of chips: type a name and press Enter or comma, or just tap away, and it
  becomes a chip with an × to take it off again. The same box is in the
  expanded row and in the details sheet.

  In the **Stores** tab that item appears under *both* headings. Each heading's
  total therefore answers "if I buy everything here, what does it cost" — so
  something tagged twice is counted in two headings. The figure at the top of
  the screen still counts every item exactly once, so your budget is unaffected.

  On a closed row, two shops read as `Metro +1` — the first one, and how many
  others there are.

- The details sheet edits a **copy** of the store list, so **Cancel** really
  does cancel.

---

## v3.3 — 2026-09-02

### Added

- **Priority sections collapse.** Tap **High**, **Medium** or **Low** and the
  section folds away, exactly like the store groups already did. The heading
  keeps showing the count and the total, so a shut section still tells you
  what's in it. Which sections are shut is remembered between visits.

  If the budget line falls inside a section you've collapsed, it's drawn
  straight under that heading — those items still cost money even when you
  can't see them.

- **The add box follows you down the page.** It used to scroll away, so adding
  something halfway through a long list meant scrolling back to the top.

- **An optional detail row under the add box.** Tap the small chevron beside
  **Add** and priority, store and price appear. None of it has to be filled
  in — typing a name and pressing Add works exactly as before, and anything
  added that way is still Medium.

  After each add the price clears (a price belongs to one item) but the store
  stays, since you usually add several things for the same shop in a row.
  Closing the row empties it, so a value you can no longer see can never act
  on you.

- **A warning when you type something you already have.** Before, adding a
  name already on the list quietly un-checked the existing item — which looked
  like nothing had happened at all if that item was buried down in Low. Now it
  says where the item is and exactly what will change, and offers to add a
  second, separate item instead. It has a *don't ask me again* box.

- **A misspelling check.** Type `ricw` when you already have `Rice` and the app
  asks whether you meant it. It works by counting how many single letters
  you'd have to change to get from one word to the other — one for short
  words, two for longer ones. Words under four letters are left alone, so
  `ice` and `rice` never get confused for each other.

### Changed

- **The confetti is quieter.** A third as many pieces, smaller, in softer
  colours, peaking about a third of the way up the screen instead of halfway,
  and fading out rather than vanishing. If the phone has Reduce Motion turned
  on it doesn't play at all.

---

## v3.2 — 2026-09-02

### Changed

- **Sign in by pasting the link instead of tapping it.** The v3.0 sign-in
  couldn't work on the phone. Tapping the emailed link opens Safari, and an
  app added to the Home Screen keeps its own separate storage — so the sign-in
  landed in Safari while the Home Screen app still showed as signed out.

  Now the app asks you to press and hold the link in the email, copy it, and
  paste it back in. The whole sign-in then happens inside the app, where it
  belongs. The link is single use, so copy it rather than tapping it.

  (A six-digit code would be nicer, but that needs a custom email provider —
  Supabase locked template editing on the free plan in June 2026.)

### Fixed

- **Signing in now backs up straight away.** Before, the first backup waited
  for the next change, so the cloud sat empty right after signing in.

- **A list saved before v3.0 is stamped as current when it loads.** Without a
  timestamp, a phone holding a real list could be mistaken for an empty one
  and have an older cloud copy written over it.

---

## v3.0 — 2026-09-02

### Added

- **Backup.** Your list used to live only on this phone. If Safari cleared its
  data, or the phone was lost, the list went with it — there was no copy
  anywhere. Now it keeps one, in a database hosted by Supabase.

- **Sign in with a magic link.** Tap the cloud icon in the top bar, type your
  email, and tap the link that arrives. No password to invent or remember.
  You do this once; it stays signed in afterwards. Signing in is only there so
  the backup knows which list is yours.

- **The cloud icon is also a status light.** Grey means backup is off, blue
  means your list is saved, red means a save failed.

### Changed

- **The phone is still in charge.** The list is read from and written to this
  phone first, exactly as before, so the app is just as fast and still works
  with no signal in the shop. The backup is sent quietly afterwards.

- **Whichever copy is newer wins.** Open the app on a phone whose data was
  wiped, and the cloud copy comes back. Make changes with no signal, and they
  go up when you're online again. The list being replaced is kept aside rather
  than thrown away.

- **Nothing here can break the list.** Signed out, offline, or if the backup
  service is unreachable, the app behaves exactly as v2.9 did.

---

## v2.9 — 2026-08-31

### Changed

- **Reverted the coloured H / M / L buttons.** Tried in 2.8, didn't like it —
  back to plain grey buttons that fill in with the priority colour when chosen.
  The letters stay.

---

## v2.8 — 2026-08-31

### Fixed

- **The Add an item dropdown is ours now.** Moving the list out of the flex row
  in v2.7 wasn't enough, because the popup is drawn by the *browser*, outside
  the page — nothing in the app could position or style it. It's now a normal
  element in the page, so it lines up with the box and matches the app.
  It also says whether a match is already on your list or sitting in the cart,
  and tapping one brings it back out of the cart.

### Changed

- **H / M / L each carry their own colour** — red, amber and grey — so the
  scale reads before you've picked anything. Choosing one fills the button in
  and turns the letter white.

---

## v2.7 — 2026-08-31

### Fixed

- **The Add an item dropdown appeared far to the left.** The list of
  suggestions was sitting inside the same side-by-side row as the text box and
  the Add button, and the browser was positioning the popup against that
  instead of against the box. Moved out to the end of the page.

### Changed

- **Swiping left now demotes before it deletes.** Anything above Low drops to
  Low; only something already in Low is deleted, and that still asks first. A
  stray swipe can no longer destroy something you cared about. The panel behind
  the row is grey for a demotion and red only when it will really delete.
- **The priority buttons say H / M / L instead of 1 / 2 / 3.** A letter can't
  be misread as a quantity, and it matches the High / Medium / Low headings.
- **Confirmation panels have a "Don't ask me again" tick.** It's remembered per
  question, so silencing the New trip prompt doesn't silence the delete one.
  It only remembers if you actually go ahead — ticking it and then cancelling
  doesn't count.

### Added

- `IDEAS.md` — where the parked plans live: the profile/stats menu, sharing,
  sync, and the things we decided against.

---

## v2.6 — 2026-08-31

### Fixed

- **"New trip" did nothing on the iPhone.** It relied on the browser's own
  confirm() popup, which was silently not appearing there. All the browser
  popups have been replaced with an in-app panel — the same kind as the
  details sheet, which was always working.
- **Opening a row no longer nudges it sideways.** The closed row's name now
  has exactly the same padding and border width as the input that replaces it,
  so the text stays put. The 4px jump was the priority stripe: an open row
  isn't inside the swipe wrapper, so it wasn't getting the same border.

### Changed

- **Renamed to "To buy list"** — it was never only for groceries.
- **The 1 / 2 / 3 badges are gone from the list.** "Chicken (1)" read like
  "buy one chicken". Priority is now a colour stripe down the left edge of the
  row; the numbers survive in the row's edit controls, where they're labelled.
- **Notes show in the list**, in italics under the item, so reading one costs
  no taps. Writing still happens in the "i" sheet.
- **Swiping left deletes**, with a confirmation. It used to send things to Low,
  which was already two taps away.
- **Price and budget fields lost their up/down arrows.** Nobody steps a price
  up from 0.1 to 0.2 — you type the number.
- **"Remove from this trip" is gone** from the details sheet. With no All items
  screen it just made things vanish with no way back. Delete is the one real
  removal, and it's in two places: swipe left, or the sheet.
- **"Never bought yet" is gone.** It said nothing. The sheet now shows a last
  bought date only when there is one.

---

## v2.5 — 2026-08-31

### Added

- **A logo in the top-left**, currently a placeholder shopfront drawing. The
  slot is reserved; swap the SVG in `index.html` when there's a real one.

### Changed

- **Priorities are now High / Medium / Low.** Low doubles as the parking bay:
  things you want eventually but aren't buying this trip.
- **Swiping a row left sends it to Low** instead of opening a store picker.
  This is the answer to the list growing forever — park something rather than
  deleting it. Swipe right still means bought.
- **The store picker is gone**; the store lives in the row when you tap it, and
  in the "i" sheet, both with autocomplete.
- **Adding an item no longer jumps you down the list or opens the new row.**
  The cursor stays in the add box so you can type ten items in a row.
- **A checked-off item's priority number fades**, so finished things stop
  competing for attention.
- **Confetti is fired upward from the bottom**, peaks around the middle of the
  screen and falls back down, instead of dropping from the top.

---

## v2.4 — 2026-08-31

### Added

- **Confetti** when the last item on the list gets checked off. Fires once,
  on the moment it becomes complete — not every time you tick something.

### Changed

- **"Finish trip" is now "New trip", and it no longer empties your list.**
  It unchecks everything and leaves it in place, ready for next week. With the
  All items screen gone, the old behaviour made the whole list vanish with no
  way to get it back. It still records what you bought.
- **The "This trip" title is gone.** In its place, a quiet line saying how many
  items you have and how many are in the cart — information rather than
  decoration. The bottom bar already says which view you're in.
- **More room at the top**, and more space between the add box and the list.
- **The add box is tinted and taller**, so it reads as the main thing you do on
  this screen rather than another grey rectangle.
- **The keyboard's blue key says the same thing in every field.** The store and
  price boxes were showing a plain return key while the name box showed "done".
- **The bottom bar sits closer to the bottom edge**, reclaiming some of the
  strip iOS reserves for the home indicator.

### Not fixable

- The small bar above the keyboard with the up/down arrows is Safari's own
  form-navigation control. A web page cannot hide it.

---

## v2.3 — 2026-08-31

### Changed

- **A budget is now genuinely optional.** The panel starts closed and shows a
  single line — how much is in your cart, and what the whole list comes to.
  That answers "what is this going to cost?" without anyone mentioning
  budgets. Open it only if you want to set one.
- **The budget field is a proper filled box** instead of a faint underline,
  and is labelled "Budget (optional)".
- **Store groups start closed.** Switching to Stores now shows just the store
  names with their counts and totals; tap the one you're standing in.
- **Items inside a store are ordered by priority**, so a 1 is never sitting
  below a 2. Previously they were alphabetical, which buried urgent things.

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
