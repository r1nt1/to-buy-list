# Research brief — "To buy list"

A description of the app, written to be pasted into a research assistant along
with the questions at the bottom.

---

## What it is

A mobile-first shopping list web app. It runs in the browser and can be added to
an iPhone Home Screen, where it opens fullscreen like a normal app. All data is
stored on the device itself — no account, no server, no sync, works offline.
Currently a personal project, not published.

It is not grocery-specific by design. Items can be anything you need to buy — a
light bulb, a tyre, a treadmill.

## The core idea

Most list apps treat an item as a task that is done once: you check it off and
it disappears. Groceries don't work that way. Buying rice doesn't mean you stop
needing rice — you'll want it again next week.

So in this app **checking an item off never deletes it**. Every item is
permanent. At the end of a shop you tap "New trip", which unchecks everything
and leaves the list intact, ready for next time. The list is a standing
inventory of things you buy, not a queue of tasks that empties.

Deleting is a separate, explicit action.

## The three features that define it

**1. Priority tiers.** Every item is High, Medium or Low, and the list is
grouped under those headings. Priority is set with three adjacent buttons that
appear when you tap a row — not through a menu. Low doubles as a parking bay
for things you want eventually but aren't buying now.

**2. Budget, and what fits in it.** Each item can have an optional price. The
app totals the cart as you shop, and — the distinctive part — draws a labelled
divider **across the list** at the exact point where the running total would
exceed your budget. Everything above the line fits; everything below it
doesn't. Because the list is ordered by priority, that line answers "what do I
cut?" without any arithmetic. The budget is entirely optional and stays
collapsed until you open it; with it closed, the app simply shows what the
whole list will cost.

**3. Stores.** Each item can be tagged with a store, typed freely (so it works
for any shop in any country, not a fixed list). A second view groups the whole
list by store, with each store collapsible and its items ordered by priority.
When you're standing in one shop you open that store and see only what you need
there. Crucially this is *where you buy it*, not *what kind of food it is* —
there are no Produce/Dairy/Frozen categories, which were deliberately removed
in favour of stores.

## Interaction details

- Tapping a row expands it in place; the name becomes editable and priority,
  store and price appear on one line beneath. No full-screen edit sheet.
- Swipe right marks an item bought.
- Swipe left demotes it to Low; swiping left again on something already in Low
  deletes it, with a confirmation.
- Notes show inline in the list, so reading one costs no taps.
- Everything a gesture does also has a visible button.

## What it deliberately does not do

Sharing or collaboration, cloud sync, accounts, barcode scanning, recipes,
meal planning, real-world price lookups, coupons or deal-hunting, and automatic
categorisation of items by food type.

---

## Questions for research

1. **Which existing shopping-list apps combine budgeting with priority
   ranking?** Not budgeting alone, and not prioritisation alone — both, working
   together, so the budget tells you what to cut.

2. **Does anything do the "budget cutoff line"** — showing, inside the list
   itself, where your money runs out given the order of items? Or do budget
   features stop at a running total?

3. **Which apps organise items by store/vendor rather than by aisle or food
   category?** Note the difference between (a) keeping a separate list per shop
   and (b) tagging each item with a store and regrouping one list by it. The
   second is what this app does.

4. **Do any apps treat the list as permanent** — unchecking rather than
   emptying — as opposed to templates, "recurring items", or a saved favourites
   list that you copy from?

Worth checking specifically: AnyList, Bring!, Listonic, Out of Milk,
OurGroceries, Cozi, Google Keep, Todoist, Apple Reminders' built-in grocery
lists, and any budget-first shopping apps.

5. **Where is the genuine gap, if any?** Is the combination of
   permanent-list + priority + budget-cutoff + store-grouping actually unserved,
   or is there an app already doing most of it? Be blunt — finding a close
   competitor now is more useful than finding one later.

6. **Is there a market**, and how do apps in this space make money — paid,
   subscription, ads, affiliate links to retailers?
