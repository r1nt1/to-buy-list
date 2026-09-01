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

## Settled, not revisiting for now

- **A fourth "none" priority.** Low already means "not this trip", and Medium
  works as the "haven't decided" default. A fourth bucket adds a decision
  without adding meaning.
- **Progressive swipe** (swipe distance picking High/Medium/Low). Possible, but
  it needs precision — the thing gestures are meant to avoid — and Safari can't
  do haptics, so you'd have to watch the screen while dragging.
