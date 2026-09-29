# To buy list

A shopping list that understands you buy the same things again and again.

Most list apps delete an item when you check it off. But buying rice doesn't mean rice
stops existing — you'll want it again next week. So here **checking off never deletes**.
When the shop is done, **New trip** unchecks everything, counts what you bought, and
leaves the list ready for next time. Deleting is a separate, deliberate action.

Live at <https://r1nt1.github.io/to-buy-list/> — add it to the iPhone Home Screen and it
opens fullscreen like an app. Add `?demo=1` to the address to see a sample list
(nothing is saved).

## What it does

- **High / Medium / Low.** Every item has a priority and the list is grouped under those
  headings. Low is the parking bay: things you want eventually, not this trip.
- **Two tabs.** *Priority* shows the list by importance. *Stores* regroups the same list
  by shop — an item can belong to several — and inside a shop you can group by aisle.
- **Budget.** Give items a price (and a quantity) and set a budget: a bar fills as you
  check things off — amber at 80 %, red only when you go over.
- **Aisles work themselves out.** A built-in Spanish/English dictionary of about 1,600
  words knows *leche* is dairy, typos included. No AI call: works offline, costs nothing.
- **Buy it again.** Ask to be reminded every week, month, year… and the item gets a small
  *due* badge when it's time. Reminders flag; they never move anything.
- **Swipes.** Right marks bought. Left drops an item to Low; left again on a Low item
  deletes it (after asking). Every swipe also has a visible button.
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
| `index.html` | The page: header, budget, add box, list, tabs, and the pop-up sheets |
| `style.css`  | All the styling. Colours are CSS variables at the very top |
| `app.js`     | All the behaviour: saving, drawing the list, adding, swipes, New trip |
| `aisles.js`  | The word → aisle dictionary and its typo-tolerant matching |
| `sync.js`    | The optional cloud backup |
| `bump-cache.sh` | Changes the `?v=` cache-buster so phones fetch fresh files |
| `CHANGELOG.md` | What changed in each version, in plain English |
| `IDEAS.md` | Ideas parked, and things decided against |
| `RESEARCH-BRIEF.md` | A description of the app plus questions, for a research assistant |
