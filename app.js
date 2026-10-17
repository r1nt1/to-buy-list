/* =================================================================
   To buy list — v4 (the exact version is the ?v= token in index.html)

   The idea in one sentence: an item is never deleted when you buy
   it, it moves to Bought and waits there until you need it again.

   Every item carries two flags:
     inTrip  – is it on the list? Left over from the old All items
               tab; everything added is on it, and nothing in the
               screens turns it off any more.
     done    – is it bought? Ticking records the purchase there and
               then (date and count). Adding it again — from the add
               box or its suggestions — brings it back.
   There is no "New trip" any more (v5.0): people shop a little most
   days, not in trips.
   ================================================================= */

// Read from this script's own ?v= token in index.html, so the label at the
// bottom can never lag behind a release again (it sat on 4.0 through 4.3).
const VERSION = ((/** @type {HTMLScriptElement | null} */ (document.querySelector('script[src*="app.js"]')))?.src || '')
  .replace(/^.*[?&]v=([^&]+).*$/, '$1') || 'dev';
const STORAGE_KEY = 'groceries.v2';
const OLD_KEY     = 'groceries.v1';   // read once, to carry old data forward

const PRIORITIES = [1, 2, 3];
// 3 (Low) doubles as the parking bay: things you want eventually but are
// not buying on this trip. Swiping a row left drops it here.
const PRI_LABEL  = { 1: 'High', 2: 'Medium', 3: 'Low' };
const PRI_SHORT  = { 1: 'H', 2: 'M', 3: 'L' };
const NO_STORE   = 'other';   // lowercase like every store; the styling capitalises

/* Icons from Lucide (lucide.dev, ISC licence — see LICENSE-lucide.txt),
   copied in as drawings rather than loaded, so they work offline. */
const ICON_PATHS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
};
const icon = (name, size = 16, stroke = 2) =>
  '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" ' +
  'stroke="currentColor" stroke-width="' + stroke + '" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[name] + '</svg>';

/* ---------------------------------------------------------------
   1. State
   --------------------------------------------------------------- */

function newItem(name, extra = {}) {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name,
    stores: [],         // free text, and more than one — rice is sold in both
    priority: 2,
    note: '',
    inTrip: true,
    done: false,
    timesBought: 0,
    lastBought: null,
    repeatDays: null,   // null means "don't remind me"; otherwise a number of days
    aisle: guessAisle(name) || NO_AISLE,   // what kind of thing it is — see aisles.js
    ...extra
  };
}

/* Everything that turns an item saved by an older version into one this
   version understands. Called on load, on a v1 migration, and on anything
   arriving from the cloud — so there is one place to change when the shape
   moves again, rather than three. */
function normaliseItem(i) {
  if (!Array.isArray(i.stores)) {
    // Up to v3.3 an item had a single `store`, as plain text.
    i.stores = i.store && String(i.store).trim() ? [String(i.store).trim()] : [];
  }
  // Kept in lowercase — you type faster without the shift key — and shown
  // capitalised by the styling. This also folds "Plaza Vea" and "plaza vea"
  // into one, which used to give two headings in the Stores tab.
  i.stores = [...new Set(i.stores.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
  delete i.store;
  // Prices and quantities went in v5.1 — deleted, not hidden (Alex's
  // call). Need four? Type "Eggs 4" in the name.
  delete i.price;
  delete i.qty;
  if (typeof i.repeatDays !== 'number' || !(i.repeatDays > 0)) i.repeatDays = null;
  // Guessed once, then stored — so whatever you set by hand is never
  // silently overwritten by the dictionary later on.
  if (typeof i.aisle !== 'string' || !AISLES.includes(i.aisle)) {
    i.aisle = guessAisle(i.name) || NO_AISLE;
  }
  return i;
}

/* A long, realistic list for trying the app out. Loaded by ?demo=1 on the
   URL and NEVER saved — your real list on the phone is untouched. */
function demoState() {
  const d = (n) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };
  const it = (name, priority, extra = {}) => newItem(name, { priority, inTrip: true, ...extra });
  return {
    ...seedState(),
    items: [
      it('Chicken thighs', 1, { stores: ['metro'] }),
      it('Rice x2', 1, { stores: ['metro', 'plaza vea'], repeatDays: 30, lastBought: d(95), timesBought: 6 }),
      it('Eggs', 1, { stores: ['metro'], repeatDays: 7, lastBought: d(9), timesBought: 22 }),
      it('Milk x3', 1, { stores: ['metro', 'wong'] }),
      it('Bread', 1, { done: true, lastBought: d(0), timesBought: 30 }),
      it('Onions', 1, { stores: ['plaza vea'] }),
      it('Tomatoes', 1, { stores: ['plaza vea'] }),
      it('Olive oil', 2, { stores: ['wong'], note: 'the big bottle, not the small one' }),
      it('Coffee', 2, { stores: ['metro'], repeatDays: 14, lastBought: d(20), timesBought: 9 }),
      it('Bananas', 2, { done: true, lastBought: d(3), timesBought: 12 }),
      it('Dish soap', 2, { stores: ['plaza vea'], repeatDays: 60, lastBought: d(30), timesBought: 4 }),
      it('Yogurt 4', 2, { stores: ['wong'] }),
      it('Pasta', 2, { stores: ['metro', 'plaza vea'] }),
      it('Toilet paper', 2, { stores: ['plaza vea'], repeatDays: 30, lastBought: d(40), timesBought: 8 }),
      it('Cheese', 2, { stores: ['wong'], note: 'edam' }),
      it('Light bulbs', 3, { stores: ['sodimac'] }),
      it('Treadmill', 3, { stores: ['sodimac'] }),
      it('Ice cream', 3, { stores: ['wong'] }),
      it('Batteries AA', 3, { stores: ['sodimac', 'metro'] }),
      it('Candles', 3, {})
    ]
  };
}

function seedState() {
  return {
    schema: 2, mode: 'priority',
    expanded: [],        // which store groups are open — none, to begin with
    expandedAisles: [],  // the same for the Aisles tab
    // Which sections are shut: Low (the parking bay) and Bought (which never
    // empties) start shut, and after that it's whatever you last did.
    collapsedPri: [3, 'bought'],
    collapseDefaults: true,
    skipAsk: {},         // confirmations you've ticked "don't ask me again" on
    items: [
      newItem('Rice',      { priority: 1 }),
      newItem('Potatoes',  { priority: 1 }),
      newItem('Chicken',   { priority: 1 }),
      newItem('Olive oil', { priority: 2 }),
      newItem('Ice cream', { priority: 3 })
    ]
  };
}

// Old v1 data used words for priority and a "category" field. Carry it
// forward rather than throwing it away: the category becomes a note, so
// nothing you typed is silently lost.
function migrateFromV1(old) {
  const map = { must: 1, should: 2, maybe: 3 };
  return {
    schema: 2,
    mode: 'priority',
    expanded: [],
    expandedAisles: [],
    collapsedPri: [],
    skipAsk: {},
    items: (old.items || []).map((i) => normaliseItem({
      ...newItem(i.name),
      id: i.id,
      stores: [],
      priority: map[i.priority] || 2,
      note: i.category && i.category !== 'Other' ? 'was category: ' + i.category : '',
      inTrip: !!i.inTrip,
      done: !!i.done,
      timesBought: i.timesBought || 0,
      lastBought: i.lastBought || null
    }))
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // A list saved before v3.0 has no backup timestamp. Stamp it now, so
      // real data on this phone is never mistaken for an empty phone and
      // overwritten by an older copy from the cloud.
      if (!localStorage.getItem('groceries.v2.savedAt')) {
        localStorage.setItem('groceries.v2.savedAt', new Date().toISOString());
      }
      if (parsed && parsed.schema === 2 && Array.isArray(parsed.items)) {
        // fill in anything a older save is missing
        if (!Array.isArray(parsed.expanded)) parsed.expanded = [];
        parsed.expanded = parsed.expanded.map((s) => String(s).toLowerCase());
        if (!Array.isArray(parsed.collapsedPri)) parsed.collapsedPri = [];
        collapseDefaults(parsed);
        if (!Array.isArray(parsed.expandedAisles)) parsed.expandedAisles = [];
        delete parsed.byAisle;   // the Group by aisle switch went in v5.1
        if (!parsed.skipAsk || typeof parsed.skipAsk !== 'object') parsed.skipAsk = {};
        delete parsed.budget;   // the budget went in v5.1
        parsed.items.forEach(normaliseItem);
        return parsed;
      }
    }
    const old = localStorage.getItem(OLD_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      if (parsed && Array.isArray(parsed.items)) return migrateFromV1(parsed);
    }
  } catch (err) {
    console.warn('Saved data could not be read, starting fresh.', err);
  }
  return seedState();
}

/* v5.1: Low and Bought start shut. A list saved before that gets them shut
   once, on its first load; from then on they stay however you leave them. */
function collapseDefaults(s) {
  if (s.collapseDefaults) return;
  s.collapsedPri = [...new Set([...s.collapsedPri, 3, 'bought'])];
  s.collapseDefaults = true;
}

const DEMO = new URLSearchParams(location.search).has('demo');

function save() {
  if (DEMO) return;   // a demo list is for looking at, never for keeping
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Could not save.', err); }
  // Then send a copy to the cloud, if backup is switched on. This runs
  // after the local save and is wrapped separately on purpose: a backup
  // problem must never stop the list saving on the phone.
  try { if (window.Cloud) Cloud.push(state); }
  catch (err) { console.warn('Could not queue the backup.', err); }
}

let state = DEMO ? demoState() : load();

/* ---------------------------------------------------------------
   2. Helpers
   --------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* Open the app as  ?today=2026-12-01  and it behaves as if that were the
   date — for trying the reminders without waiting weeks. Buy something and
   start a new trip on one pretend day, then open it again on a later one.
   Nothing about this is saved; drop the ?today and it's really today. */
const FAKE_TODAY = new URLSearchParams(location.search).get('today');
function now() {
  if (FAKE_TODAY) {
    const [y, m, d] = FAKE_TODAY.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}

// Today in YOUR timezone. toISOString() gives UTC, which in the evening
// is already tomorrow — that would stamp items with the wrong day.
function todayLocal() {
  const d = now();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/* Whole days between a 'YYYY-MM-DD' stamp and today, counted in your own
   timezone — the same way todayLocal() writes them. */
function daysSince(stamp) {
  if (!stamp) return null;
  const [y, m, d] = String(stamp).split('-').map(Number);
  if (!y || !m || !d) return null;
  const then  = new Date(y, m - 1, d);
  const today = now();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then.getTime()) / 86400000);
}

/* "3 months ago", the way you'd say it. */
function ago(stamp) {
  const d = daysSince(stamp);
  if (d === null) return '';
  if (d <= 0)  return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14)  return d + ' days ago';
  if (d < 60)  return Math.round(d / 7) + ' weeks ago';
  if (d < 365) return Math.round(d / 30) + ' months ago';
  const y = Math.round(d / 365);
  return y === 1 ? 'a year ago' : y + ' years ago';
}

/* "3 Oct", or "3 Oct 2027" if it isn't this year. */
function shortDate(stamp) {
  const [y, m, d] = String(stamp).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const s = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return y === now().getFullYear() ? s : s + ' ' + y;
}

function addDays(stamp, n) {
  const [y, m, d] = String(stamp).split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const pad = (x) => String(x).padStart(2, '0');
  return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
}

/* Something you asked to be reminded about, that you last bought long
   enough ago. Nothing you have never bought is ever "due" — there is no
   date to count from — and nothing already in the cart is either. */
function isDue(item) {
  if (!item.repeatDays || !item.lastBought || item.done) return false;
  const since = daysSince(item.lastBought);
  return since !== null && since >= item.repeatDays;
}

const byName    = (a, b) => a.name.localeCompare(b.name);
// Due things go to the top of their own section — they never change
// section (v5.1; the old rule was that reminders move nothing at all).
const dueFirst  = (a, b) => Number(isDue(b)) - Number(isDue(a)) || byName(a, b);
// Bought: the most recent first. Things ticked before v5.0 have no date and
// sit at the bottom. 'YYYY-MM-DD' stamps sort correctly as plain text.
const byNewest  = (a, b) => (b.lastBought || '').localeCompare(a.lastBought || '') || byName(a, b);
const findItem  = (id) => state.items.find((i) => i.id === id);
const tripItems = () => state.items.filter((i) => i.inTrip);
// Which store headings an item belongs under. Something with no store at
// all still has to appear somewhere, so it lands in "Other".
const storesOf  = (item) => (item.stores.length ? item.stores : [NO_STORE]);
const aisleOf   = (item) => (AISLES.includes(item.aisle) ? item.aisle : NO_AISLE);

/* Adds a store to an item, ignoring blanks and ones it already has.
   Matching ignores case, so "metro" can't become a second Metro. */
function addStore(item, raw) {
  const name = String(raw || '').trim().toLowerCase();   // see normaliseItem
  if (!name || item.stores.includes(name)) return false;
  item.stores.push(name);
  return true;
}

function update(fn) { fn(); save(); render(); }

/* Which row is expanded. While a row is open the list order is frozen,
   so the row never jumps out from under your finger mid-edit. */
let openId = null;
let focusPending = false;

// Opening a row does NOT focus the name field. On iPhone, focusing an input
// raises the keyboard and scrolls it into view — the row you tapped jumped.
// Tap the name itself when you want to edit it.
// The open item floats over the list rather than pushing it down (v5.1).
function openRow(id) {
  openId = id;
  render();
  placeFloat(true);
}
function closeRow()  { if (openId === null) return; openId = null; render(); }

/* ---------------------------------------------------------------
   3. Trip view
   --------------------------------------------------------------- */

function renderTrip() {
  const onTrip  = tripItems();
  const inCart  = onTrip.filter((i) => i.done).sort(byNewest);
  const pend    = onTrip.filter((i) => !i.done);

  $('#trip-list').innerHTML =
    fakeTodayHtml() +
    // Stores and Aisles tabs: bought things stay in their group, greyed
    // out, and there is no separate Bought section — the question there is
    // "what did I get here".
    (state.mode === 'store' ? byPlaceHtml(onTrip, 'store')
      : state.mode === 'aisle' ? byPlaceHtml(onTrip, 'aisle')
      : byPriorityHtml(pend)) +
    emptyHtml(pend, onTrip) +
    (state.mode === 'priority' ? cartHtml(inCart) : '') +
    openFloatHtml();
  placeFloat(false);

  if (focusPending && openId) {
    const input = $('.name-input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
  focusPending = false;
}

/* A section heading. Tapping it anywhere opens or closes the section
   (v5.1 — it used to be only the label and the chevron, leaving the gap
   between free for closing an open row; a tap with a row open now only
   closes the row, wherever it lands). */
function groupHeadHtml({ attr, key, label, count, open, tone = '' }) {
  return '<div class="group-head' + (open ? '' : ' collapsed') +
           (tone ? ' ' + tone : '') + '" ' + attr + '="' + esc(key) + '">' +
    '<button class="gh-label" ' + attr + '="' + esc(key) + '">' +
      esc(label) + ' · ' + count + '</button>' +
    '<button class="gh-caret" ' + attr + '="' + esc(key) + '" aria-label="' +
      (open ? 'Collapse ' : 'Expand ') + esc(label) + '"><span class="caret">' + icon('chevronDown', 17, 2.2) + '</span></button>' +
  '</div>';
}

/* Only the ?today= testing note now. The "4 things are due: …" banner
   went in v5.0 — it repeated the "due" badges already on the rows. */
function fakeTodayHtml() {
  return FAKE_TODAY
    ? '<div class="fake-today">Pretending today is ' + esc(FAKE_TODAY) + '</div>' : '';
}

function byPriorityHtml(pend) {
  let html = '';
  for (const p of PRIORITIES) {
    const group = pend.filter((i) => i.priority === p).sort(dueFirst);
    if (!group.length) continue;
    const open = !state.collapsedPri.includes(p);
    html += groupHeadHtml({ attr: 'data-pri', key: p, label: PRI_LABEL[p],
                            count: group.length, open, tone: 'gh' + p });
    if (open) html += '<div class="card">' + group.map(rowHtml).join('') + '</div>';
  }
  return html;
}

/* The Stores and Aisles tabs: the same list, regrouped by where you buy
   it or by what kind of thing it is. Every group starts shut; tap a heading
   to open it.

   Aisles never group the *priority* list: with a real list that fell into
   a dozen groups of one. The Aisles tab (v5.1) is its own arrangement, and
   replaced the old "Group by aisle" switch inside a store. */
function byPlaceHtml(items, kind) {
  const keysOf = kind === 'store' ? storesOf : (i) => [aisleOf(i)];
  const open = kind === 'store' ? state.expanded : state.expandedAisles;
  const keys = [...new Set(items.flatMap(keysOf))];
  // Stores alphabetically, "Other" last; aisles in the dictionary's order,
  // which ends with Other too.
  if (kind === 'store') {
    keys.sort((a, b) => Number(a === NO_STORE) - Number(b === NO_STORE) || a.localeCompare(b));
  } else {
    keys.sort((a, b) => AISLES.indexOf(a) - AISLES.indexOf(b));
  }

  let html = '';
  for (const key of keys) {
    // Inside a group, the most urgent things come first — same order as the
    // priority view, so a 1 is never buried under a 2. Bought things last.
    // An item tagged with two shops appears under both.
    const group = items.filter((i) => keysOf(i).includes(key))
                       .sort((a, b) => a.done - b.done || a.priority - b.priority || dueFirst(a, b));
    // A shop or aisle with nothing left to buy there isn't shown at all.
    const toBuy = group.filter((i) => !i.done).length;
    if (!toBuy) continue;
    const isOpen = open.includes(key);
    html += groupHeadHtml({ attr: kind === 'store' ? 'data-store' : 'data-aisle', key, label: key,
                            count: toBuy, open: isOpen,
                            tone: 'gh-place' });
    if (isOpen) html += '<div class="card">' + group.map(rowHtml).join('') + '</div>';
  }
  return html;
}

function rowHtml(item) {
  // The open item still draws its closed row, invisibly: it holds the
  // item's place, and the floating card is laid exactly over it.
  const held = item.id === openId;

  // The stores get the whole second line, so all of them fit.
  const bits = [];
  if (item.stores.length && state.mode !== 'store') {
    bits.push(...item.stores.map((s) => '<span class="store-name">' + esc(s) + '</span>'));
  }
  // The reminder gets its own line under the stores, so it never has to
  // share space with a long list of shop names.
  const due = isDue(item);

  return '' +
    '<div class="swipe-wrap' + (held ? ' held' : '') + '">' +
      '<div class="swipe-bg">' +
        // Swipe right uncovers H / M / L, three blocks in their own colours;
        // it stays open for a tap (v5.1).
        '<span class="sb-l pick-group" data-id="' + item.id + '">' +
          PRIORITIES.map((p) => '<button class="pick v' + p +
            (!item.done && item.priority === p ? ' on' : '') +
            '" data-act="pick" data-value="' + p + '" tabindex="-1">' + PRI_SHORT[p] + '</button>').join('') +
        '</span>' +
        '<span class="sb-r">delete</span>' +
      '</div>' +
      // The priority is a colour stripe down the left edge rather than a
      // number — a "1" next to Chicken read like "buy one chicken".
      '<div class="row pri' + item.priority + (item.done ? ' done' : '') +
        '" data-id="' + item.id + '">' +
        '<button class="check" data-act="toggle-done" aria-label="Check off">' + icon('check', 14, 3) + '</button>' +
        '<button class="row-main" data-act="open">' +
          '<span class="row-line">' +
            '<span class="row-name">' + esc(item.name) +
              // A marker only. Deciding it is worth buying stays your job.
              (due ? ' <span class="due-pill">⟳ due</span>' : '') +
            '</span>' +
          '</span>' +
          (bits.length ? '<span class="row-sub">' + bits.join(' · ') + '</span>' : '') +
          (due ? '<span class="row-sub row-due">bought ' + ago(item.lastBought) + '</span>' : '') +
          // In Bought, when — the list's memory of what you got (v5.1).
          (item.done && item.lastBought ? '<span class="row-sub">bought ' + ago(item.lastBought) + '</span>' : '') +
          (item.note ? '<span class="row-note">' + esc(item.note) + '</span>' : '') +
        '</button>' +
      '</div>' +
    '</div>';
}

// The expanded row: name becomes editable, and the controls come to you.
/* The open item: one card floating over the list, laid exactly over its
   own row (which stays in place, invisible), with its controls hanging
   below it — so nothing in the list moves (v5.1). The priority stripe runs
   down the whole card and changes colour as you pick H, M or L.
   Its controls are one line: H/M/L on the left, stores on the right. The
   chip box only grows when you actually put more shops in it. */
function openFloatHtml() {
  const item = openId && findItem(openId);
  if (!item) return '';
  const pri = PRIORITIES.map((p) =>
    '<button class="pri v' + p + (item.priority === p ? ' on' : '') +
    '" data-act="set-priority" data-value="' + p + '">' + PRI_SHORT[p] + '</button>'
  ).join('');
  return '<div class="row open open-float pri' + item.priority + '" data-id="' + item.id + '">' +
    '<div class="open-head">' +
      '<input class="name-input" data-field="name" value="' + esc(item.name) + '" ' +
        'enterkeyhint="done" autocomplete="off">' +
      '<button class="info-btn" data-act="info" aria-label="More details">i</button>' +
      // A big, obvious way out — tapping empty space to close was fiddly.
      '<button class="info-btn done-btn" data-act="close" aria-label="Done">' + icon('check', 18, 2.6) + '</button>' +
    '</div>' +
    '<div class="open-controls">' +
      '<div class="pri-group">' + pri + '</div>' +
      chipsHtml(item.stores, 'store-add') +
    '</div>' +
  '</div>';
}

/* Lays the card over the held row, as wide as its card, so the name sits
   where it was; the card is always taller than the row. When the row has
   just been opened and the card would end up behind the tab bar, the page
   scrolls just enough to show it. */
function placeFloat(justOpened) {
  const float = /** @type {HTMLElement | null} */ (document.querySelector('.open-float'));
  const held = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.held'));
  if (!float || !held.length) return;
  // In Stores, an item sold in two shops is drawn twice: the card goes over
  // the first; the second shows normally.
  held.forEach((h, i) => { if (i) h.classList.remove('held'); });
  const anchor = held[0];
  const list = $('#trip-list').getBoundingClientRect();
  const card = (anchor.closest('.card') || anchor).getBoundingClientRect();
  const row = anchor.getBoundingClientRect();
  float.style.top = (row.top - list.top) + 'px';
  float.style.left = (card.left - list.left) + 'px';
  float.style.width = card.width + 'px';
  if (!justOpened) return;
  const hidden = float.getBoundingClientRect().bottom - ($('.tabs').getBoundingClientRect().top - 8);
  if (hidden > 0) window.scrollBy({ top: hidden, behavior: 'smooth' });
}

/* A store chip: the name, and a × that takes it off. */
function chipHtml(name) {
  return '<span class="chip">' + esc(name) +
         '<button type="button" class="chip-x" data-act="chip-remove" ' +
         'data-value="' + esc(name) + '" aria-label="Remove ' + esc(name) + '">' + icon('x', 15, 2.2) + '</button></span>';
}

/* The whole box: the chips already on, then a text box for the next one.
   Enter or a comma turns what you have typed into a chip; so does tapping
   away. The chip is inserted straight into the page rather than through a
   redraw, so the keyboard never closes between two stores. */
function chipsHtml(stores, field, id) {
  return '<div class="chips"' +
    (id ? ' id="' + id + '"' : '') + '>' +
    stores.map(chipHtml).join('') +
    '<input class="chip-input" data-field="' + field + '" list="store-names" ' +
    'placeholder="' + (stores.length ? '+ store' : 'store') + '" ' +
    'autocomplete="off" autocapitalize="words" enterkeyhint="done"></div>';
}

function emptyHtml(pend, onTrip) {
  if (pend.length) return '';
  return '<p class="empty">' + (onTrip.length
    ? 'Everything is bought. 🎉<br>When you need something again, type it above —<br>it comes back with its store and priority.'
    : 'Nothing on your list yet.<br>Start typing above — the box remembers everything<br>you have bought before.')
    + '</p>';
}

function cartHtml(inCart) {
  if (!inCart.length) return '';
  const open = !state.collapsedPri.includes('bought');
  return groupHeadHtml({ attr: 'data-pri', key: 'bought', label: 'Bought',
                         count: inCart.length, open }) +
         (open ? '<div class="card">' + inCart.map(rowHtml).join('') + '</div>' : '');
}

/* ---------------------------------------------------------------
   5. Render
   --------------------------------------------------------------- */

function render() {
  /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.tab')).forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === state.mode));
  $('#version').textContent = 'version ' + VERSION +
    (FAKE_TODAY ? ' · pretending today is ' + FAKE_TODAY : '');

  renderTrip();

  // Autocomplete for the store box — every store you have ever typed.
  $('#store-names').innerHTML =
    [...new Set(state.items.flatMap((i) => i.stores))].sort()
      .map((s) => '<option value="' + esc(s) + '">').join('');
}

/* ---------------------------------------------------------------
   Asking a question
   The browser's own confirm() box is inconsistent on iPhone — it was
   silently doing nothing there, which is why "New trip" appeared dead.
   This is the same kind of panel as the details sheet, which works.
   --------------------------------------------------------------- */

const askDlg = $('#ask-dialog');
let askAnswer = null;

let askRemember = null;

/* Resolves true for the main button, the string 'alt' for the optional
   middle one, and false for Cancel. */
function ask(title, body, { yes = 'OK', alt = null, danger = false,
                            cancel = true, remember = null } = {}) {
  // Already told us not to ask? Then don't — just say yes and get on with it.
  if (remember && state.skipAsk[remember]) return Promise.resolve(true);

  return new Promise((resolve) => {
    $('#ask-title').textContent = title;
    $('#ask-body').textContent = body;
    const yesBtn = $('#ask-yes');
    yesBtn.textContent = yes;
    yesBtn.classList.toggle('solid-danger', danger);
    $('#ask-no').classList.toggle('hidden', !cancel);

    const altBtn = $('#ask-alt');
    altBtn.textContent = alt || '';
    altBtn.classList.toggle('hidden', !alt);
    // Three buttons side by side wrap into unreadable stacks of one word on a
    // phone. With a third option, stack them full-width instead.
    $('#ask-dialog menu').classList.toggle('stacked', !!alt);

    askRemember = remember;
    $('#ask-remember').classList.toggle('hidden', !remember);
    $('#ask-remember-box').checked = false;

    askAnswer = resolve;
    askDlg.showModal();
  });
}

function answer(value) {
  // Only remember the choice if they actually went ahead with it.
  if (value && askRemember && $('#ask-remember-box').checked) {
    state.skipAsk[askRemember] = true;
    save();
  }
  askRemember = null;
  askDlg.close();
  if (askAnswer) askAnswer(value);
  askAnswer = null;
}

$('#ask-yes').addEventListener('click', () => answer(true));
$('#ask-alt').addEventListener('click', () => answer('alt'));
$('#ask-no').addEventListener('click', () => answer(false));
askDlg.addEventListener('cancel', (e) => { e.preventDefault(); answer(false); });

/* ---------------------------------------------------------------
   6. Actions
   --------------------------------------------------------------- */

function handleClick(event) {
  if (justSwiped) { justSwiped = false; return; }
  // With an item open, a tap anywhere else in the list only closes it —
  // it doesn't also open another row or fold a section.
  if (openId && !event.target.closest('.open-float')) {
    commitOpenRow();
    closeRow();
    return;
  }
  const head = event.target.closest('[data-store]');
  if (head) {                                  // collapse / expand a store group
    const store = head.dataset.store;
    update(() => {
      state.expanded = state.expanded.includes(store)
        ? state.expanded.filter((s) => s !== store)
        : [...state.expanded, store];
    });
    return;
  }

  const aisleHead = event.target.closest('[data-aisle]');
  if (aisleHead) {                             // collapse / expand an aisle group
    const aisle = aisleHead.dataset.aisle;
    update(() => {
      state.expandedAisles = state.expandedAisles.includes(aisle)
        ? state.expandedAisles.filter((a) => a !== aisle)
        : [...state.expandedAisles, aisle];
    });
    return;
  }

  const priHead = event.target.closest('[data-pri]');
  if (priHead) {                               // collapse / expand a priority section
    // Priority sections are numbers; Bought is the word 'bought'.
    const raw = priHead.dataset.pri;
    const p = raw === 'bought' ? raw : Number(raw);
    update(() => {
      state.collapsedPri = state.collapsedPri.includes(p)
        ? state.collapsedPri.filter((n) => n !== p)
        : [...state.collapsedPri, p];
    });
    return;
  }

  const btn = event.target.closest('[data-act]');
  if (!btn) return;
  const holder = btn.closest('[data-id]') || btn;
  const item = findItem(holder.dataset.id);
  if (!item) return;

  switch (btn.dataset.act) {
    case 'open':
      if (openId === item.id) closeRow(); else openRow(item.id);
      break;

    case 'toggle-done':
      commitOpenRow();
      update(() => { setBought(item, !item.done); openId = null; });
      maybeCelebrate();
      break;

    case 'pick':
      // From the swipe-right picker. On a Bought row it also means "I need
      // this again", so it comes back into that section.
      closePicker();
      update(() => {
        item.priority = Number(btn.dataset.value);
        if (item.done) needAgain(item);
      });
      break;

    case 'set-priority':
      // Change state but do NOT redraw — the row would jump away mid-edit.
      item.priority = Number(btn.dataset.value);
      save();
      btn.parentElement.querySelectorAll('.pri')
         .forEach((b) => b.classList.toggle('on', b === btn));
      // ...but the card's stripe takes the new colour straight away.
      holder.classList.remove('pri1', 'pri2', 'pri3');
      holder.classList.add('pri' + item.priority);
      break;

    case 'toggle-trip':
      update(() => {
        item.inTrip = !item.inTrip;
        if (!item.inTrip) item.done = false;
      });
      break;

    case 'chip-remove': {
      const gone = btn.dataset.value.toLowerCase();
      // Take the name out first so a half-typed one in the box isn't
      // committed by commitOpenRow and immediately re-added.
      item.stores = item.stores.filter((s) => s.toLowerCase() !== gone);
      const box = btn.closest('.chips') && btn.closest('.chips').querySelector('.chip-input');
      if (box) box.value = '';
      commitOpenRow();
      update(() => {});
      break;
    }

    case 'info':
      commitOpenRow();
      openInfo(item);
      break;

    case 'close':
      commitOpenRow();
      closeRow();
      break;
  }
}

// Inline fields save on blur/Enter without redrawing, so focus is never stolen.
function handleFieldChange(event) {
  const input = event.target.closest('[data-field]');
  if (!input) return;
  const item = findItem(input.closest('[data-id]').dataset.id);
  if (!item) return;
  applyField(item, input);
  save();
}

function applyField(item, input) {
  const v = input.value;
  if (input.dataset.field === 'name') {
    item.name = v.trim() || item.name;
    // Correcting a typo should fix the aisle too — but only when the app
    // never managed to work one out. An aisle you chose is never overruled.
    if (item.aisle === NO_AISLE) item.aisle = guessAisle(item.name) || NO_AISLE;
  }
  // A chip box appends rather than replaces, and empties itself.
  if (input.dataset.field === 'store-add') {
    if (addStore(item, v)) {
      input.insertAdjacentHTML('beforebegin', chipHtml(item.stores[item.stores.length - 1]));
      input.placeholder = '+ store';
    }
    input.value = '';
  }
}

// Pull whatever is currently typed in the open row into state before redrawing.
function commitOpenRow() {
  if (!openId) return;
  const item = findItem(openId);
  if (!item) return;
  document.querySelectorAll('.open-float [data-field]').forEach((i) => applyField(item, i));
  save();
}

$('#trip-list').addEventListener('click', handleClick);
$('#trip-list').addEventListener('change', handleFieldChange);

// Enter closes the open row; Escape closes it too.
$('#trip-list').addEventListener('keydown', (e) => {
  // In a chip box, Enter and comma mean "that's one store, ready for the
  // next" rather than "I'm finished with this row".
  const chip = e.target.closest('.chip-input');
  if (chip && (e.key === 'Enter' || e.key === ',') && chip.value.trim()) {
    e.preventDefault();
    const item = findItem(chip.closest('[data-id]').dataset.id);
    if (item) { applyField(item, chip); save(); }
    return;
  }

  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault();
    e.target.blur();          // fires change, which saves
    commitOpenRow();
    closeRow();
  }
});

// Tapping anywhere outside the open item closes it (taps inside the list
// are handled at the top of handleClick).
document.addEventListener('click', (e) => {
  if (!openId) return;
  const target = /** @type {Element} */ (e.target);
  if (target.closest('.open-float') || target.closest('dialog')) return;
  // Taps in the list were already dealt with by handleClick — including the
  // one that just opened this item, whose row has since been redrawn away.
  if ($('#trip-list').contains(target) || !document.contains(target)) return;
  commitOpenRow();
  closeRow();
});

/* ---------------- adding ---------------- */

// editDistance() — "ricw" is one change from "rice" — lives in aisles.js,
// where the aisle guesser uses the same check.

/* The closest thing already on the list, if it is close enough to be a
   typo rather than a different thing. Short words allow one change only —
   otherwise "ice" would keep asking whether you meant "rice". Anything
   under four letters is left alone entirely. */
function nearMatch(name) {
  const n = name.toLowerCase();
  if (n.length < 4) return null;
  const limit = n.length <= 5 ? 1 : 2;
  let best = null, bestD = 99;
  for (const item of state.items) {
    const d = editDistance(n, item.name.toLowerCase());
    if (d > 0 && d <= limit && d < bestD) { best = item; bestD = d; }
  }
  return best;
}

/* What the detail row is currently set to.

   No priority is lit until you tap one, and that unlit state is the honest
   one: it means "I haven't said". A new item then comes out Medium, and an
   item you already have keeps whatever priority it was on. Lighting H makes
   it High in both cases. */
/* Stores chosen in the add box, as chips — exactly like an open row.
   The chip is put straight into the page rather than through a redraw, so
   the keyboard stays up between two stores. */
let addStores = [];
function commitAddStore() {
  const box = $('#add-store');
  const name = box.value.trim().toLowerCase();
  box.value = '';
  if (!name || addStores.includes(name)) return;
  addStores.push(name);
  box.insertAdjacentHTML('beforebegin', chipHtml(name));
  box.placeholder = '+ store';
}
function clearAddStores() {
  addStores = [];
  $('#add-stores').querySelectorAll('.chip').forEach((c) => c.remove());
  $('#add-store').value = '';
  $('#add-store').placeholder = 'store';
}
$('#add-stores').addEventListener('click', (e) => {
  const x = e.target.closest('.chip-x');
  if (!x) return;
  addStores = addStores.filter((s) => s !== x.dataset.value.toLowerCase());
  x.closest('.chip').remove();
  if (!addStores.length) $('#add-store').placeholder = 'store';
});
$('#add-store').addEventListener('change', commitAddStore);   // tapping away
$('#add-store').addEventListener('keydown', (e) => {
  if (e.key === ',' && e.target.value.trim()) { e.preventDefault(); commitAddStore(); }
});

function addFields() {
  const on = $('#add-pri .on');
  commitAddStore();   // a half-typed store counts too
  return {
    pri: on ? Number(on.dataset.addPri) : null,
    stores: [...addStores]
  };
}

function clearAddBox() {
  $('#add-input').value = '';
  clearAddStores();                 // stores belong to that item, not the next one
  setAddPri(null);                  // back to "haven't said"
  renderSuggestions();
  $('#add-input').focus();
}

function setAddPri(p) {
  /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('#add-pri .pri')).forEach((b) =>
    b.classList.toggle('on', p !== null && Number(b.dataset.addPri) === p));
}

// Bring an item that already exists back onto this trip.
function reviveExisting(item, f) {
  update(() => {
    item.inTrip = true;
    needAgain(item);
    if (f.pri !== null)  item.priority = f.pri;
    f.stores.forEach((st) => addStore(item, st));
  });
}

/* Exactly what tapping the main button would do to an item you already
   have. Anything that isn't listed here doesn't happen — no silent edits. */
function changeList(item, f) {
  const bits = [];
  if (f.pri !== null && f.pri !== item.priority) bits.push('move it to ' + PRI_LABEL[f.pri]);
  const newStores = f.stores.filter((st) => !item.stores.includes(st));
  if (newStores.length) bits.push('add ' + newStores.join(' and ') + ' to its stores');
  if (item.done)                                  bits.push('take it out of Bought');
  return bits;
}

function sentence(bits) {
  if (bits.length < 2) return bits[0] || '';
  return bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1];
}

function whereItIs(item) {
  return item.done ? 'in your cart' : 'in ' + PRI_LABEL[item.priority];
}

$('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#add-input').value.trim();
  if (!name) return;

  const f = addFields();
  const exact = state.items.find((i) => i.name.toLowerCase() === name.toLowerCase());
  const near  = exact ? null : nearMatch(name);
  const hit   = exact || near;

  if (hit) {
    // It used to be added silently, which looked like nothing had happened
    // when the item was buried down in Low.
    const changes = changeList(hit, f);
    const title = exact ? '"' + hit.name + '" is already on your list'
                        : 'Did you mean "' + hit.name + '"?';
    const lead  = exact ? 'It is ' + whereItIs(hit) + '.'
                        : 'You typed "' + name + '", and "' + hit.name +
                          '" is already on your list, ' + whereItIs(hit) + '.';
    const body  = changes.length
      ? lead + ' Using it will ' + sentence(changes) + '.'
      : lead + ' Nothing to change.';

    const answer = await ask(title, body, {
      yes: changes.length ? (exact ? 'Use it' : 'Use "' + hit.name + '"') : 'Leave it there',
      alt: 'Add "' + name + '" separately',
      remember: exact ? 'duplicate' : null
    });

    if (answer === false) return;
    if (answer !== 'alt') {
      if (changes.length) reviveExisting(hit, f);
      clearAddBox();
      return;
    }
    // 'alt' means they really do want a second, separate item.
  }

  update(() => {
    state.items.push(newItem(name, {
      priority: f.pri ?? 2,
      stores: f.stores
    }));
  });
  // Deliberately does NOT open the new row or scroll to it — you should be
  // able to type ten items in a row without being dragged down the list.
  clearAddBox();
});

/* ---------------- the detail row ---------------- */

/* Shown while you're in the add box — the box has focus, or there's text in
   it, or you're on one of its own controls. When you leave with the box
   empty it goes away and empties itself, so nothing you can no longer see
   can be applied to the next thing you add. */
function syncAddMore() {
  if (document.querySelector('dialog[open]')) return;   // a question is up; hold still
  const wrap  = $('.add-wrap');
  const input = $('#add-input');
  const show  = wrap.contains(document.activeElement) || input.value.trim() !== '';
  const more  = $('#add-more');
  if (!show && !more.classList.contains('hidden')) {
    setAddPri(null);
    clearAddStores();
  }
  more.classList.toggle('hidden', !show);
}
// focusout fires before the next element takes focus, so wait a tick.
$('.add-wrap').addEventListener('focusin',  () => setTimeout(syncAddMore, 0));
$('.add-wrap').addEventListener('focusout', () => setTimeout(syncAddMore, 0));
$('.add-wrap').addEventListener('click',    () => setTimeout(syncAddMore, 0));
$('#add-input').addEventListener('input',   syncAddMore);
// iPhone Safari often leaves the box focused when you tap a row or a
// heading (things that can't take focus themselves), so the line stayed up.
// A touch anywhere outside the add box, while it's empty, counts as leaving.
document.addEventListener('pointerdown', (e) => {
  const wrap = $('.add-wrap');
  if (wrap.contains(/** @type {Node} */ (e.target)) || $('#add-input').value.trim()) return;
  const active = /** @type {HTMLElement | null} */ (document.activeElement);
  if (active && wrap.contains(active)) active.blur();
  setTimeout(syncAddMore, 0);
});

$('#add-pri').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-pri]');
  if (!btn) return;
  // Tapping the lit one turns it off again, so a mis-tap is undoable
  // without having to add the item first.
  setAddPri(btn.classList.contains('on') ? null : Number(btn.dataset.addPri));
});

/* ---------------------------------------------------------------
   Suggestions under the add box
   Drawn by us rather than by the browser, so it lines up with the
   box and looks like the rest of the app.
   --------------------------------------------------------------- */

const suggestBox = $('#suggest');

function renderSuggestions() {
  const typed = $('#add-input').value.trim().toLowerCase();
  const matches = typed
    ? state.items.filter((i) => i.name.toLowerCase().includes(typed)).sort(byName).slice(0, 6)
    : [];

  if (!matches.length) {
    suggestBox.classList.add('hidden');
    suggestBox.innerHTML = '';
    return;
  }

  suggestBox.innerHTML = matches.map((i) =>
    '<button type="button" class="suggest-row" data-pick-item="' + i.id + '">' +
      '<span>' + esc(i.name) + '</span>' +
      '<span class="suggest-hint">' +
        (i.done ? 'bought' : 'already on your list') +
      '</span>' +
    '</button>').join('');
  suggestBox.classList.remove('hidden');
}

suggestBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick-item]');
  if (!btn) return;
  const item = findItem(btn.dataset.pickItem);
  if (!item) return;
  // Tapping one means "I need this" — so bring it back out of Bought.
  update(() => { needAgain(item); });
  $('#add-input').value = '';
  renderSuggestions();
  $('#add-input').focus();
});

$('#add-input').addEventListener('input', renderSuggestions);
$('#add-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { $('#add-input').value = ''; renderSuggestions(); }
});
/* Is the add box stuck at the top right now? Only then does its slab cover
   the strip under the clock. Checked on scroll, cheaply. */
(function watchStuck() {
  const wrap = $('.add-wrap');
  const probe = $('#safe-probe');
  let last = null;
  function check() {
    const safe = probe.getBoundingClientRect().height;
    const stuck = wrap.getBoundingClientRect().top <= safe + 0.5 && window.scrollY > 0;
    if (stuck !== last) { wrap.classList.toggle('stuck', stuck); last = stuck; }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
})();

// The keyboard's Done key (Enter). With text in the box it adds the item;
// with nothing typed it just puts the keyboard away. iOS shows "Done" for
// enterkeyhint="done" but does not submit the form on its own.
$('.add-wrap').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target.matches('input')) return;
  e.preventDefault();
  if (e.target.id === 'add-store' && e.target.value.trim()) { commitAddStore(); return; }
  if ($('#add-input').value.trim()) $('#add-form').requestSubmit();
  else e.target.blur();
});
document.addEventListener('click', (e) => {
  if (!(/** @type {Element} */ (e.target)).closest('.add-wrap')) suggestBox.classList.add('hidden');
});

/* ---------------- view toggle ---------------- */


/* ---------------- bought ----------------
   Ticking records the purchase there and then — one more time bought,
   and today's date — because there is no "New trip" any more to do it.
   Unticking straight after (a mis-tap) puts the old record back, so a
   stray tap never counts as shopping. */
function setBought(item, done) {
  if (done === !!item.done) return;
  if (done) {
    // Remember the record as it was, for as long as it stays ticked.
    item.undoBought = { lastBought: item.lastBought || null, timesBought: item.timesBought || 0 };
    item.timesBought = (item.timesBought || 0) + 1;
    item.lastBought = todayLocal();
  } else {
    if (item.undoBought) {
      item.lastBought = item.undoBought.lastBought;
      item.timesBought = item.undoBought.timesBought;
    }
    delete item.undoBought;
  }
  item.done = done;
}

/* Out of Bought because you need it again: the purchase really happened,
   so its record stays. */
function needAgain(item) {
  delete item.undoBought;
  item.done = false;
}

/* ---------------- tabs ---------------- */
/** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.tab')).forEach((tab) => {
  tab.addEventListener('click', () => {
    commitOpenRow();
    update(() => {
      state.mode = tab.dataset.mode;
      openId = null;
      // arrive with every group shut
      if (state.mode === 'store') state.expanded = [];
      if (state.mode === 'aisle') state.expandedAisles = [];
    });
    window.scrollTo(0, 0);
  });
});

/* ---------------- details sheet ---------------- */
const info = $('#info-dialog');
let infoId = null;

function openInfo(item) {
  infoId = item.id;
  const f = $('#info-form');
  // Aisles are automatic. The picker is only for the handful the dictionary
  // doesn't know, so it stays out of the way the rest of the time.
  const unknownAisle = aisleOf(item) === NO_AISLE;
  $('#aisle-row').classList.toggle('hidden', !unknownAisle);
  f.aisle.value = aisleOf(item);
  showRepeat(item.repeatDays);
  f.note.value = item.note || '';
  $('#info-title').textContent = item.name;
  // Only worth a line if it actually tells you something.
  const lines = [];
  if (item.repeatDays && item.lastBought) {
    lines.push('Bought ' + ago(item.lastBought));
    lines.push(isDue(item) ? 'due now'
                           : 'next on ' + shortDate(addDays(item.lastBought, item.repeatDays)));
  }
  $('#info-stat').textContent = lines.join(' · ');
  $('#info-stat').classList.toggle('hidden', !lines.length);
  info.showModal();
  // The browser focuses the first control in a dialog — the Repeat dropdown —
  // and on the phone a focused dropdown pops open by itself. Focus the title instead.
  $('#info-title').focus();
}

/* One list, the way a phone normally asks this. The extra box only appears
   if you pick "every so many days", so the common cases are a single tap. */
const REPEAT_PRESETS = [0, 7, 14, 30, 90, 180, 365];

function showRepeat(days) {
  const f = $('#info-form');
  const n = days || 0;
  const isPreset = REPEAT_PRESETS.includes(n);
  f.repeat.value = isPreset ? String(n) : 'custom';
  f.repeatDays.value = isPreset ? '' : n;
  $('#repeat-custom').classList.toggle('hidden', isPreset);
}

function repeatValue() {
  const f = $('#info-form');
  if (f.repeat.value !== 'custom') return Number(f.repeat.value) || null;
  const n = parseInt(f.repeatDays.value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

$('#info-repeat').addEventListener('change', () => {
  const custom = $('#info-form').repeat.value === 'custom';
  $('#repeat-custom').classList.toggle('hidden', !custom);
  if (custom) $('#info-form').repeatDays.focus();
});

$('#info-cancel').addEventListener('click', () => info.close());

$('#info-form').addEventListener('submit', () => {
  const item = findItem(infoId);
  if (!item) return;
  const f = $('#info-form');
  update(() => {
    item.note = f.note.value.trim();
    item.aisle = f.aisle.value;
    item.repeatDays = repeatValue();
  });
});



async function confirmDelete(item) {
  const ok = await ask('Delete "' + item.name + '"?',
                       'It goes for good.',
                       { yes: 'Delete', danger: true, remember: 'delete' });
  if (!ok) return;
  update(() => {
    state.items = state.items.filter((i) => i.id !== item.id);
    openId = null;
  });
}

$('#info-delete').addEventListener('click', () => {
  const item = findItem(infoId);
  if (!item) return;
  info.close();
  confirmDelete(item);
});

/* ---------------------------------------------------------------
   7. Swipe
   Swipe a row right to uncover H / M / L and tap one (v5.1 — it used to
   mark the item bought, which the check circle already does). Swipe left
   to delete it, with an Undo bar, so a stray swipe costs nothing. Both
   also have ordinary buttons (H/M/L in the open row, Delete in the i
   sheet), so a gesture is never the only way to do something.
   --------------------------------------------------------------- */

const SWIPE_TRIGGER = 70;   // how far you must drag before it counts
let sw = null;
let justSwiped = false;
let picking = null;         // the row held open on its H / M / L

function openPicker(row, wrap) {
  const pick = /** @type {HTMLElement} */ (wrap.querySelector('.sb-l'));
  wrap.classList.add('sw-right', 'picking');
  row.style.transform = 'translateX(' + pick.offsetWidth + 'px)';
  picking = { row, wrap };
}

function closePicker() {
  if (!picking) return;
  picking.row.style.transform = '';
  picking.wrap.classList.remove('sw-right', 'picking');
  picking = null;
}

$('#trip-list').addEventListener('pointerdown', (e) => {
  justSwiped = false;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  // With a picker open, a touch anywhere but its buttons just closes it —
  // and the tap that follows does nothing else.
  if (picking && !e.target.closest('.swipe-bg')) {
    closePicker();
    justSwiped = true;
    return;
  }

  const row = e.target.closest('.row');
  if (!row || row.classList.contains('open')) return;

  // Starting right at the left edge is iOS's own "go back" gesture. Leave it alone.
  if (e.clientX < 24) return;

  sw = { row, wrap: row.parentElement, x: e.clientX, y: e.clientY, dx: 0, active: false };
});

window.addEventListener('pointermove', (e) => {
  if (!sw) return;
  const dx = e.clientX - sw.x;
  const dy = e.clientY - sw.y;

  if (!sw.active) {
    // Decide once whether this is a sideways swipe or the page being scrolled.
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
    if (Math.abs(dx) < 12) return;
    sw.active = true;
    sw.row.style.transition = 'none';
  }

  sw.dx = dx;
  sw.row.style.transform = 'translateX(' + dx + 'px)';
  sw.wrap.classList.toggle('sw-right', dx > 0);
  sw.wrap.classList.toggle('sw-left',  dx < 0);
  sw.wrap.classList.toggle('sw-armed', Math.abs(dx) >= SWIPE_TRIGGER);
});

function endSwipe() {
  if (!sw) return;
  const { row, wrap, dx, active } = sw;
  sw = null;

  row.style.transition = 'transform .18s';
  row.style.transform = '';
  wrap.classList.remove('sw-right', 'sw-left', 'sw-armed');

  if (!active) return;
  justSwiped = true;                 // stop this becoming a tap as well

  const item = findItem(row.dataset.id);
  if (!item) return;

  if (dx >= SWIPE_TRIGGER) {
    openPicker(row, wrap);
  } else if (dx <= -SWIPE_TRIGGER) {
    deleteWithUndo(item);
  }
}

/* ---------------- delete, with an Undo bar ----------------
   A swipe deletes straight away — no question first — and a bar at the
   bottom offers Undo for a few seconds. Undo puts the item back exactly
   where it was. A second delete while the bar is up makes the first one
   final and offers Undo for the new one. */

const UNDO_MS = 5000;
let undoable = null;   // { item, index } — the last thing deleted
let undoTimer = null;

function deleteWithUndo(item) {
  const index = state.items.indexOf(item);
  if (index === -1) return;
  update(() => { state.items.splice(index, 1); });
  undoable = { item, index };
  $('#toast-text').textContent = item.name + ' deleted';
  $('#toast').classList.remove('hidden');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndo, UNDO_MS);
}

function hideUndo() {
  clearTimeout(undoTimer);
  undoable = null;
  $('#toast').classList.add('hidden');
}

$('#toast-undo').addEventListener('click', () => {
  if (!undoable) return;
  const { item, index } = undoable;
  update(() => { state.items.splice(Math.min(index, state.items.length), 0, item); });
  hideUndo();
});

// ...and a touch outside the list altogether (the add box, the tabs).
document.addEventListener('pointerdown', (e) => {
  if (picking && !(/** @type {Element} */ (e.target)).closest('#trip-list')) closePicker();
});

window.addEventListener('pointerup', endSwipe);
window.addEventListener('pointercancel', endSwipe);

/* ---------------------------------------------------------------
   9. Confetti — fires the moment the last item is checked off
   --------------------------------------------------------------- */

let wasComplete = tripItems().length > 0 && tripItems().every((i) => i.done);

function maybeCelebrate() {
  const on = tripItems();
  const complete = on.length > 0 && on.every((i) => i.done);
  if (complete && !wasComplete) confetti();
  wasComplete = complete;
}

function confetti() {
  // If the phone is set to reduce motion (iOS: Settings → Accessibility →
  // Motion → Reduce Motion) skip it entirely rather than showing a smaller
  // version — someone who turned that on doesn't want a shrunken one either.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width  = window.innerWidth  * dpr;
  const H = canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  // Launched upward from the bottom edge, then gravity brings it back down.
  // A thing thrown upward reaches a height of v² / 2g, so to peak about a
  // third of the way up we need a starting speed of √(2g × 0.34H). It used
  // to peak at half the screen with three times as many pieces — this is
  // the same idea, said more quietly.
  const gravity = 0.5 * dpr;
  const launch  = Math.sqrt(2 * gravity * H * 0.34);

  // Softened versions of the priority colours — the old set was fully
  // saturated, which is what made it shout.
  const colours = ['#e0798a', '#e8b96b', '#7fa3e8', '#6fbd92', '#b08fc7'];
  const bits = [];
  for (let i = 0; i < 42; i++) {
    bits.push({
      x: W * (0.08 + Math.random() * 0.84),
      y: H + Math.random() * 30 * dpr,
      vx: (Math.random() - 0.5) * 4.5 * dpr,
      vy: -launch * (0.8 + Math.random() * 0.4),     // some go higher than others
      w: (3.5 + Math.random() * 3) * dpr,
      h: (5 + Math.random() * 4) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.22,
      colour: colours[i % colours.length]
    });
  }

  const LIFE = 150;
  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    // Fade over the last third so it dissolves rather than snapping away.
    ctx.globalAlpha = Math.max(0, Math.min(1, (LIFE - frame) / 45));
    for (const b of bits) {
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      b.vy += gravity;
      b.vx *= 0.995;                 // a touch of air resistance
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.colour;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    frame++;
    // stop once it has faded out, or once everything has fallen past the bottom
    if (frame < LIFE && bits.some((b) => b.y < H + 60 * dpr)) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}

/* ---------------- go ---------------- */
$('#info-aisle').innerHTML =
  AISLES.map((a) => '<option value="' + esc(a) + '">' + esc(a) + '</option>').join('');
render();

/* Cloud backup — see sync.js. Called once the page is already drawn, so
   a slow network never delays the list appearing.

   adoptFromCloud runs only when the cloud copy is NEWER than this
   phone's: a wiped Safari, or a new phone. The list being replaced is
   stashed under its own key first, so nothing is ever truly gone. */
function adoptFromCloud(data) {
  if (!data || !Array.isArray(data.items)) return;
  try { localStorage.setItem('groceries.v2.replaced', JSON.stringify(state)); }
  catch { /* the stash is a nicety, not a requirement */ }

  state = data;
  // An older save may predate some fields, exactly as load() guards for.
  if (!Array.isArray(state.expanded))  state.expanded  = [];
  if (!Array.isArray(state.collapsedPri)) state.collapsedPri = [];
  collapseDefaults(state);
  if (!Array.isArray(state.expandedAisles)) state.expandedAisles = [];
  delete state.byAisle;
  if (!state.skipAsk || typeof state.skipAsk !== 'object') state.skipAsk = {};
  delete state.budget;
  state.items.forEach(normaliseItem);

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Could not save the restored list.', err); }
  render();
}

if (window.Cloud) Cloud.start(adoptFromCloud, () => state);
