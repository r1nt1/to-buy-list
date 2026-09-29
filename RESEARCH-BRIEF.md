# Research brief — "To buy list"

A description of the app, written to be pasted into a research assistant along
with the questions at the bottom. Describes v4.3 (September 2026).

---

## What it is

A mobile-first shopping list web app. It runs in the browser and can be added to
an iPhone Home Screen, where it opens fullscreen like a normal app. The list is
stored on the device itself and works offline; an optional email sign-in keeps
a backup copy in the cloud, so a wiped browser or a new phone doesn't lose it.
A personal project, published free at https://r1nt1.github.io/to-buy-list/ —
no ads, no payments. Prices are in Peruvian soles (S/).

It is not grocery-specific by design. Items can be anything you need to buy — a
light bulb, a tyre, a treadmill.

## The core idea

Most list apps treat an item as a task that is done once: you check it off and
it disappears. Groceries don't work that way. Buying rice doesn't mean you stop
needing rice — you'll want it again next week.

So in this app **checking an item off never deletes it**. Every item is
permanent. At the end of a shop you tap "New trip", which unchecks everything,
records what was bought and when, and leaves the list intact, ready for next
time. The list is a standing inventory of things you buy, not a queue of tasks
that empties.

Deleting is a separate, explicit action.

## The features that define it

**1. Priority tiers.** Every item is High, Medium or Low, and the list is
grouped under those headings, each with its own count and total. Priority is set
with three adjacent buttons that appear when you tap a row — not through a menu.
Low doubles as a parking bay for things you want eventually but aren't buying
now.

**2. Budget.** Each item can have an optional price and quantity. You type a
budget once; a bar fills as you check things into the cart — amber from 80 %,
red only when over — next to the amount in the cart. The budget appears only
once something has a price. (An earlier version drew a "budget runs out here"
line across the list; it was removed because order within a section is
alphabetical, so the line cut through things you wanted.)

**3. Stores, then aisles.** Each item can be tagged with one or more stores,
typed freely (so it works for any shop in any country, not a fixed list). A
second tab groups the whole list by store, each store collapsible with its own
total. Standing in one shop, you can switch on "Group by aisle" to split it
into Produce, Dairy, Frozen and so on. The aisle comes from a built-in
Spanish/English dictionary of about 1,600 words with typo tolerance — not from
the store and not from an AI — so it works offline for any shop. A store is
*where* you buy something; an aisle is *what it is*. Aisles never group the
priority list.

**4. Buy it again.** An item can be set to repeat — every week, month, year, or
any number of days. When it's due (counted from the last time it was bought),
the row gets a small "due" badge and a line at the top says what's due. It only
flags; nothing moves or changes priority by itself. No push notifications.

## Interaction details

- Tapping a row expands it in place: name, priority, quantity, price and stores
  are edited right there. A small "i" sheet holds only the note, the repeat
  setting and Delete.
- Swipe right marks an item bought.
- Swipe left demotes it to Low; swiping left again on something already in Low
  deletes it, with a confirmation.
- Adding a name that's already on the list says where it is and what will
  change, and a near-miss spelling is caught against your own list.
- Notes show inline in the list, so reading one costs no taps.
- Everything a gesture does also has a visible button.

## What it deliberately does not do

Sharing or collaboration, barcode scanning, recipes, meal planning, real-world
price lookups, coupons or deal-hunting, and push notifications.

---

## Questions for research

1. **Which existing shopping-list apps combine budgeting with priority
   ranking?** Not budgeting alone, and not prioritisation alone — both, working
   together, so the budget tells you what to cut.

2. **How far do budget features go in shopping-list apps?** A running total
   only, or a budget with a warning as you approach it, per-store spend, or
   anything that shows *which* items fit?

3. **Which apps organise items by store/vendor rather than by aisle or food
   category?** Note the difference between (a) keeping a separate list per shop
   and (b) tagging each item with one or more stores and regrouping one list by
   it. The second is what this app does. Do any then sort by aisle *within* a
   store without needing to know what that store stocks?

4. **Do any apps treat the list as permanent** — unchecking rather than
   emptying — as opposed to templates, "recurring items", or a saved favourites
   list that you copy from? And do any remind you to rebuy something on a
   schedule without moving it around the list?

Worth checking specifically: AnyList, Bring!, Listonic, Out of Milk,
OurGroceries, Cozi, Google Keep, Todoist, Apple Reminders' built-in grocery
lists, and any budget-first shopping apps.

5. **Where is the genuine gap, if any?** Is the combination of
   permanent-list + priority + budget + store-then-aisle grouping + rebuy
   reminders actually unserved, or is there an app already doing most of it?
   Be blunt — finding a close competitor now is more useful than finding one
   later.

6. **Is there a market**, and how do apps in this space make money — paid,
   subscription, ads, affiliate links to retailers?
