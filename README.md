# To buy list

A shopping list that understands you buy the same things again and again.

Most list apps delete an item when you check it off. But buying rice doesn't mean rice
stops existing — you'll want it again next week. So here **checking off never deletes**.
Ticking an item records the purchase and moves it to **Bought**; when you need it again,
type it in the add box and it comes back with its store and priority. Deleting is a separate,
deliberate action (swipe left, with Undo).

Live at <https://r1nt1.github.io/to-buy-list/> — add it to the iPhone Home Screen and it
opens fullscreen like an app. Add `?demo=1` to the address to see a sample list
(nothing is saved).

## What it does

- **High / Medium / Low.** Every item has a priority and the list is grouped under those
  headings. Low is the parking bay: things you want eventually, not this trip.
- **Three tabs.** *Priority* shows the list by importance; Low and Bought start folded
  away and stay however you leave them. *Stores* regroups the same list by shop — an
  item can belong to several — and *Aisles* by what kind of thing it is.
- **No prices, no quantities.** Kept simple on purpose (v5.1). Need four? Type
  "Eggs 4" or "Eggs x4".
- **Bought is the memory.** Newest first, each row says when ("bought 3 days ago").
- **Aisles work themselves out.** A built-in Spanish/English dictionary of about 1,600
  words knows *leche* is dairy, typos included, and reads Spanish names the Spanish way
  (a *filtro de agua* is a filter). No AI call: works offline, costs nothing. A wrong
  guess can be changed in the details sheet, and your choice is kept.
- **Buy it again.** Ask to be reminded every week, month, year… and the item gets a small
  *due* badge when it's time, and moves to the top of its own section — never to
  another one.
- **Swipes.** Right uncovers H / M / L — tap one. Left deletes. Every swipe also has a
  visible button (H/M/L in the dock, Delete in the details sheet).
- **Undo.** For a few seconds after a change of priority, a tick or a delete, a pop-up
  at the bottom offers to undo it.
- **Editing by the thumb, and nothing jumps.** Tapping an item lifts it where it is;
  its controls sit in a dock at the bottom of the screen (above the keyboard while you
  type). Adding a new item uses the same dock.
- **Cloud backup (optional).** Sign in with your email and a copy is kept in Supabase, so
  a wiped browser or a new phone doesn't lose the list.

## Running it

Everything is plain HTML, CSS and JavaScript. There is nothing to build. To view it
locally:

```
python3 -m http.server 4173 --directory .
```

Then open <http://localhost:4173>. `?today=2026-12-01` on the address makes the app act
as if it were that date, for trying reminders.

After changing a file, run `./bump-cache.sh` so browsers fetch the new version instead
of a stored old copy. At release, set the `?v=` numbers in `index.html` back to a clean
version — the version shown at the bottom of the list reads it.

## Where the data lives

In `localStorage` — a small storage box the browser keeps on the device. That copy is
the live one, so the app works with no signal. If you sign in, a copy also goes to
Supabase shortly after each change; when the app opens, whichever copy is newer wins,
and the replaced one is kept aside. Signed out, nothing leaves the phone.

The Supabase key in `sync.js` is a *publishable* key, designed to be public. What
protects each person's list is Row Level Security in the database.

## The files

| File | What's in it |
|---|---|
| `index.html` | The page: header, add box, list, tabs, and the pop-up sheets |
| `style.css`  | All the styling. Colours are CSS variables at the very top |
| `app.js`     | All the behaviour: saving, drawing the list, adding, swipes, Bought |
| `aisles.js`  | The word → aisle dictionary and its typo-tolerant matching |
| `sync.js`    | The optional cloud backup |
| `bump-cache.sh` | Changes the `?v=` cache-buster so phones fetch fresh files |
| `CHANGELOG.md` | What changed in each version, in plain English |
| `IDEAS.md` | Ideas parked, and things decided against |
| `RESEARCH-BRIEF.md` | A description of the app plus questions, for a research assistant |
| `LICENSE-lucide.txt` | The licence for the Lucide icons (free; the notice must stay with them) |
