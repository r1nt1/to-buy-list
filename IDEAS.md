# Ideas parked for later

Things discussed but deliberately not built yet, and why.

## Menu with Profile, settings and stats

A way into the things that aren't the list itself.

- **Stats** are the easy win and could come first. The app already records how
  many times you've bought each item and when you last bought it — that data is
  being collected right now, it just isn't shown anywhere. "Popcorn × 14 this
  year" needs no new plumbing.
- **Profile / account** only becomes meaningful once there's a server to log
  into, so it waits for sync.
- **Where it lives:** probably a small button in the header next to the logo
  rather than a hamburger. The bottom bar should stay as the two list views —
  mixing "which arrangement am I looking at" with "settings" in the same strip
  makes both harder to find.

## Sharing stats to social media

Worth separating two goals that pull in different directions: making an app
*you* use every week, and making an app that attracts *other* users. Sharing
serves the second. It's a reasonable thing to want, but it adds a whole surface
(what gets shared, what it looks like, what's private) to an app whose current
strength is being small and fast. Better revisited once the daily-use version
is genuinely finished.

## Accounts and sync across devices

Agreed direction: a managed backend (Supabase or similar) rather than running a
server. Deferred until the app has been used for real on the phone for a while
— see the conversation for the reasoning, especially about offline editing
being the hard part rather than the login.

## Drag to reorder / drag between priority groups

Discussed and deferred. Dragging is the most expensive interaction on the web
to make feel right: it needs long-press detection, auto-scrolling when you
near the edge of the screen, a live preview of where the item will land, and it
fights the browser's own scrolling. Without haptics there's also no physical
feedback when an item picks up or drops.

Against that cost, it mostly duplicates something that already takes two taps
(open the row, tap H/M/L). Worth revisiting only if real use shows constant
re-prioritising.

The genuinely *new* thing dragging would allow is custom ordering **within** a
group — items are alphabetical today. If that turns out to matter, a simpler
sort option is a much cheaper way to get there than drag-and-drop.

## Aisle grouping in the priority list

Built, tried, and taken out on 2026-09-02 — kept only inside the Stores tab.

Two reasons, both found by looking at it rather than by arguing about it:

- With a real list it collapsed into a dozen headings of one item each. The
  priority view's job is "what do I buy first", and a dozen single-item
  groups answer nothing.
- It cost the budget cutoff line. That line only means something while the
  list is ordered by priority — in aisle order it marks an arbitrary spot,
  so it had to be suppressed, which removed the priority view's best feature
  to add a worse one.

The underlying insight stands and is worth not re-deriving: a **store** is
where you buy something and you tag it; an **aisle** is what the thing *is*
and the dictionary knows it. They're independent, which is why the app never
needs to know what any shop stocks. Walking order only matters once you are
standing in a shop, so the Stores tab is its natural and only home.

## Settled, not revisiting for now

- **A fourth "none" priority.** Low already means "not this trip", and Medium
  works as the "haven't decided" default. A fourth bucket adds a decision
  without adding meaning.
- **Progressive swipe** (swipe distance picking High/Medium/Low). Possible, but
  it needs precision — the thing gestures are meant to avoid — and Safari can't
  do haptics, so you'd have to watch the screen while dragging.

## Decided on 2026-09-03 (the v4.0 build day)

Things tried, or discussed, and settled — with the reason, so they aren't
re-proposed without a new argument.

- **Aisles group items inside a shop only, not in the priority list.** Built
  both, compared them on a real list: the priority list fell into a dozen
  groups of one. Walking order only matters once you're standing in a shop.
- **No "budget runs out here" line.** Within a section items are alphabetical,
  so the line cut through things you fully meant to buy because their names
  came late. The bar at the top (amber from 80%, red only when over) is the
  honest version.
- **No whole-list total.** It counts Low, which is the parking bay, and the
  section headings already total each tier.
- **Reminders flag, never move.** A due item gets a badge and a line at the
  top; nothing changes priority on its own. Repeat is one picker (the iOS
  wheel), with a days box only for "every … days".
- **Stores, quantity and price live in the row only.** The i sheet is Note,
  Repeat, Delete. Two places to edit the same thing was one too many. The
  aisle picker appears only for items the dictionary didn't recognise.
- **Aisles come from a built-in dictionary, not an AI call.** Offline in a
  supermarket basement, free, instant, and no secret key to leak from a
  public repo. Typos are forgiven (one letter for short words, two for long).
- **Store names are kept lowercase** and capitalised by the styling — type
  without the shift key, and "Plaza Vea" / "plaza vea" can't split.
- **No priority lit by default under the add box.** Unlit means "haven't
  said": a new item is Medium, an existing one keeps what it had. Lighting M
  by default would have offered to demote an existing High item.

## Still open (bring to the next session)

Alex has more modifications and questions queued. Start from CHANGELOG.md's
v4.0 entry and this list. `main` = v3.3, branch `v4` = everything above;
nothing pushed yet.
