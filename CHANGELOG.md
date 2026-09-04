# Changelog

Newest first. Written to be readable, not technical.

**Numbering:** the big number changes when the app works noticeably
differently or the shape of saved data changes; the small number for
everything else. The running version shows at the bottom of the list.

---

## v4.0 — 2026-09-03 (branch `v4`, not yet released)

Big number because saved data changed shape: an item now has a *list* of
stores, not one. Old saves are converted on first load; nothing is lost.

### Added
- **Several stores per item.** Chips: type a name, Enter/comma/tap-away makes
  a chip, × removes it. In the Stores tab the item appears under every shop
  it carries, so each heading's total means "everything here"; the budget
  still counts each item once.
- **Buy it again.** In the **i** sheet: `Repeat  Every month ›` (Never / week
  / 2 weeks / month / 3 / 6 months / year / every … days). When due, the row
  gets a small `⟳ due` badge with *bought 3 months ago* in the small print,
  and one line at the top says what's due. **That's all it does** — nothing
  moves or re-prioritises itself. Never-bought items are never due. No push
  notifications (would need a server). Test with `?today=2026-06-01` on the
  URL: the app pretends it's that date; a line at the top says so.
- **Group by aisle, Stores tab only.** A switch above the store list breaks
  each open shop into aisles (Produce, Meat, Frozen … 33 in all). Categories
  come from `aisles.js`, ~1,600 Spanish/English words with typo tolerance —
  a dictionary, not an AI call: offline, free, instant, no key to leak from a
  public repo. A store is *where* you buy; an aisle is *what it is* — so the
  app never needs to know what a shop stocks. Unrecognised items land in
  Other and get a picker in the sheet; your choice always wins.
- **Quantity stepper** `− 1 +` in the open row; shows as `Leche ×2`, price on
  that line is the total.
- **Sheet as settings rows** (label left, value right): Note, Repeat, Delete.
  Stores, quantity and price are edited in the row only.

### Changed
- **Calmer colours: priority by brightness.** The High/Medium/Low stripes
  are three greys, darkest for High (brightest in dark mode), instead of
  red/amber/grey — the headings already say the word, so colour is free to
  mean something else. Add, the cart bar and the ticks are green; the
  `⟳ due` badge and *bought 3 months ago* are blue (a note, not a warning);
  red appears only on Delete and an over-budget bar. Also the safest of the
  three palettes tried for colour blindness. The other two are in IDEAS.md.
- **Tapping a row no longer jumps.** The name field used to take focus on
  open, which on iPhone raised the keyboard and scrolled the row. Now tap the
  name when you want to edit it.
- **Budget line says only what's in the cart.** The bar shows how that
  compares to the budget; the "left"/"over" sum is gone.
- The sheet's "bought / due" line shows only when a repeat is set; the
  "countdown starts the first time you buy it" line is gone. Note label and
  text line up; a little more air under the title and before the buttons.
- **`?demo=1`** on the URL shows a 20-item sample list. Nothing is saved, so
  your real list is untouched. Handy for showing someone the app.
- Opening the sheet no longer pops the Repeat list open (the title takes
  focus instead of the first control). No double line under Note.
- **Reminder text on its own line** under the stores, so it never fights
  with a long list of shop names.
- **Sheet buttons on one row:** Delete on the left, Cancel and Save on the
  right. The confirmation box already says it's for good.
- **Budget block is two lines:** the budget you type is the headline; a bar
  fills as you check things off (amber from 80 %, red only when over), with
  `S/45 in cart · S/155 left`. No whole-list total (it counted Low). Enter
  drops the keyboard. Appears once anything has a price.
- **The "budget runs out here" line is gone** — alphabetical order within a
  section made it cut through wanted items.
- **Open row** = name/price/stores as flat text on underlines; priority,
  quantity and price are three matching capsules spread across the line;
  stores on their own line beneath. The add-box row matches exactly.
- **Store names stored lowercase**, shown capitalised — `Plaza Vea` and
  `plaza vea` can no longer split into two headings.
- **Closed rows** show the price on the name line (under the section total)
  and every store in the small print.

---

## v3.3 — 2026-09-02 (on `main`, not yet pushed)

### Added
- **Collapsible priority sections.** Tap the label or the far-right chevron;
  count and total stay visible; remembered. The gap between them is
  deliberately dead — that's how you dismiss an open row.
- **Sticky add box** that follows you down the page.
- **Detail row under the add box** (priority, store, price) appears when the
  box has focus or text, hides when empty and you tap away. No priority lit
  by default = "haven't said": new items are Medium, existing keep theirs.
  Price clears after each add; store stays.
- **Duplicate warning.** Adding a name you already have used to silently
  un-check it (invisible if it sat in Low). Now a dialog says where it is and
  exactly what will change, or lets you add a separate item. Has *don't ask
  again*.
- **Misspelling check** against your own list (1 letter for short words, 2
  for long, nothing under 4 letters).

### Changed
- **Confetti quieter**: a third as many pieces, softer, lower, fades out;
  skipped under Reduce Motion.

---

## v3.2 — 2026-09-02
- **Sign in by pasting the emailed link, not tapping it.** Tapping opens
  Safari, whose storage the Home Screen app can't see. Link is single-use.
  (A 6-digit code needs custom SMTP — Supabase locked templates on free.)
- Fixed: first backup now happens right after sign-in; a pre-v3.0 list is
  stamped current on load so an older cloud copy can't overwrite it.

## v3.0 — 2026-09-02
- **Cloud backup** via Supabase, magic-link sign-in (cloud icon = status:
  grey off, blue saved, red failed). Phone stays the live copy — still works
  offline; newest copy wins; the replaced list is kept aside. Signed out or
  offline, it behaves exactly as v2.9.

## v2.9 → v2.5 — 2026-08-31
- 2.9 reverted the coloured H/M/L buttons (2.8): plain until chosen.
- 2.8 own suggestion dropdown (browser's can't be styled/positioned); shows
  "already on your list" / "in cart".
- 2.7 swipe-left demotes to Low first, deletes only from Low (with ask);
  H/M/L letters instead of 1/2/3; *Don't ask me again* per question,
  remembered only if you proceed; IDEAS.md created.
- 2.6 replaced browser `confirm()` (silently dead on iPhone) with an in-app
  panel; renamed to "To buy list"; priority is a colour stripe (a "1" read as
  a quantity); notes shown inline; spinner arrows removed from number fields.
- 2.5 High/Medium/Low (Low = parking bay); swipe left → Low; store picker
  removed, store lives in the row; adding doesn't jump/open the row.

## v2.4 → v2.0 — 2026-08-31
- 2.4 confetti on completing the list; **New trip** unchecks instead of
  emptying; keyboard "done" on every field. *Not fixable:* Safari's own
  up/down bar above the keyboard.
- 2.3 budget optional and collapsed by default; store groups start closed;
  items inside a store ordered by priority.
- 2.2 **taps were dead**: the invisible swipe panel was catching them
  (`pointer-events: none`). **Cache-buster** `?v=` on css/js so the phone
  stops running old files. All-items tab removed; bottom bar = Priority /
  Stores.
- 2.1 swipe right = bought; inputs ≥16 px so iOS doesn't zoom; one-line row
  controls.
- 2.0 tap-to-expand rows, priority buttons, free-text stores with
  autocomplete, by-priority/by-store views, collapsible stores, notes,
  self-hiding budget, S/ currency, v1 data migrated.

## v1.0 — 2026-08-22
Pantry + Trip: checking off never deletes. Priority chip, prices, cart
total, budget line, Finish trip, all on-device. Fixed: UTC dates a day
ahead (Peru evenings), overflowing edit box.
