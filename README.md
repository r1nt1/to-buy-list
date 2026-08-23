# Groceries — Pantry & Trip

A grocery list that understands groceries are a **recurring set**, not one-off tasks.

Apple Reminders deletes an item when you check it off. But buying rice doesn't mean rice
stops existing — you'll want it again next week. So this app splits the data in two:

- **Pantry** — everything you ever buy. Never empties.
- **Trip** — this week's run, pulled from the Pantry. Checking an item off completes it
  *for this trip only*. Next week it's back, unchecked.

## What it does

- One-tap priority chips (`Must` → `Should` → `Maybe`) — no menus, no long-press.
- Optional prices, a running cart total, and a **"budget runs out here"** line drawn
  across the list at the exact point your cart would go over.
- **Finish trip** clears the list for next week and remembers what you bought, so your
  most-bought items surface as "usual suspects" for one-tap re-adding.

## Running it

Everything is plain HTML, CSS and JavaScript. There is nothing to install and nothing
to build. To view it locally:

```
python3 -m http.server 4173 --directory .
```

Then open <http://localhost:4173>.

## Where the data lives

In `localStorage` — a small storage box the browser keeps on the device. Nothing is sent
anywhere, there are no accounts, and it works with no internet connection. Clearing your
browser's site data for this app erases the list.

## The files

| File | What's in it |
|---|---|
| `index.html` | The two screens and the edit sheet |
| `style.css`  | All the styling. Colours are CSS variables at the very top |
| `app.js`     | All the behaviour: state, saving, rendering, and every button |
