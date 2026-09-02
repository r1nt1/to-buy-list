/* =================================================================
   To buy list — v2.9

   The idea in one sentence: an item is never deleted when you buy
   it, it just leaves this trip and waits in All items for next week.

   Every item carries two separate flags:
     inTrip  – is it on this week's list?
     done    – have I put it in the cart on THIS trip?
   "Finish trip" clears both. The item itself survives.
   ================================================================= */

const VERSION     = '4.0';
const STORAGE_KEY = 'groceries.v2';
const OLD_KEY     = 'groceries.v1';   // read once, to carry old data forward

// Change this if you want a different currency, e.g. '$' or '€'.
const CURRENCY = 'S/';

const PRIORITIES = [1, 2, 3];
// 3 (Low) doubles as the parking bay: things you want eventually but are
// not buying on this trip. Swiping a row left drops it here.
const PRI_LABEL  = { 1: 'High', 2: 'Medium', 3: 'Low' };
const PRI_SHORT  = { 1: 'H', 2: 'M', 3: 'L' };
const NO_STORE   = 'Other';

/* ---------------------------------------------------------------
   1. State
   --------------------------------------------------------------- */

function newItem(name, extra = {}) {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name,
    stores: [],         // free text, and more than one — rice is sold in both
    priority: 2,
    price: null,        // null means "haven't said what it costs"
    qty: 1,
    note: '',
    inTrip: true,
    done: false,
    timesBought: 0,
    lastBought: null,
    repeatDays: null,   // null means "don't remind me"; otherwise a number of days
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
  i.stores = i.stores.map((s) => String(s).trim()).filter(Boolean);
  delete i.store;
  if (typeof i.repeatDays !== 'number' || !(i.repeatDays > 0)) i.repeatDays = null;
  return i;
}

function seedState() {
  return {
    schema: 2, budget: 0, mode: 'priority',
    expanded: [],        // which store groups are open — none, to begin with
    collapsedPri: [],    // which priority sections are shut — none, to begin with
    addOpen: false,      // is the optional detail row under the add box showing?
    budgetOpen: false,   // the budget panel stays shut until you open it
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
    budget: old.budget || 0,
    mode: 'priority',
    expanded: [],
    collapsedPri: [],
    addOpen: false,
    budgetOpen: false,
    skipAsk: {},
    items: (old.items || []).map((i) => normaliseItem({
      ...newItem(i.name),
      id: i.id,
      stores: [],
      priority: map[i.priority] || 2,
      price: i.price ?? null,
      qty: i.qty || 1,
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
        if (!Array.isArray(parsed.collapsedPri)) parsed.collapsedPri = [];
        if (typeof parsed.addOpen !== 'boolean') parsed.addOpen = false;
        if (typeof parsed.budgetOpen !== 'boolean') parsed.budgetOpen = false;
        if (!parsed.skipAsk || typeof parsed.skipAsk !== 'object') parsed.skipAsk = {};
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

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Could not save.', err); }
  // Then send a copy to the cloud, if backup is switched on. This runs
  // after the local save and is wrapped separately on purpose: a backup
  // problem must never stop the list saving on the phone.
  try { if (window.Cloud) Cloud.push(state); }
  catch (err) { console.warn('Could not queue the backup.', err); }
}

let state = load();

/* ---------------------------------------------------------------
   2. Helpers
   --------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);
const money = (n) => CURRENCY + (Math.round(n * 100) / 100).toFixed(2);

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Today in YOUR timezone. toISOString() gives UTC, which in the evening
// is already tomorrow — that would stamp items with the wrong day.
function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/* Whole days between a 'YYYY-MM-DD' stamp and today, counted in your own
   timezone — the same way todayLocal() writes them. */
function daysSince(stamp) {
  if (!stamp) return null;
  const [y, m, d] = String(stamp).split('-').map(Number);
  if (!y || !m || !d) return null;
  const then = new Date(y, m - 1, d);
  const now  = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now - then) / 86400000);
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

const lineTotal = (item) => (item.price || 0) * (item.qty || 1);
const byName    = (a, b) => a.name.localeCompare(b.name);
const findItem  = (id) => state.items.find((i) => i.id === id);
const tripItems = () => state.items.filter((i) => i.inTrip);
// Which store headings an item belongs under. Something with no store at
// all still has to appear somewhere, so it lands in "Other".
const storesOf  = (item) => (item.stores.length ? item.stores : [NO_STORE]);

/* Adds a store to an item, ignoring blanks and ones it already has.
   Matching ignores case, so "metro" can't become a second Metro. */
function addStore(item, raw) {
  const name = String(raw || '').trim();
  if (!name) return false;
  if (item.stores.some((s) => s.toLowerCase() === name.toLowerCase())) return false;
  item.stores.push(name);
  return true;
}

function update(fn) { fn(); save(); render(); }

/* Which row is expanded. While a row is open the list order is frozen,
   so the row never jumps out from under your finger mid-edit. */
let openId = null;
let focusPending = false;

function openRow(id) { openId = id; focusPending = true; render(); }
function closeRow()  { if (openId === null) return; openId = null; render(); }

/* ---------------------------------------------------------------
   3. Trip view
   --------------------------------------------------------------- */

function renderTrip() {
  const onTrip  = tripItems();
  const inCart  = onTrip.filter((i) => i.done).sort(byName);
  const pend    = onTrip.filter((i) => !i.done);
  const cartSum = inCart.reduce((s, i) => s + lineTotal(i), 0);

  renderBudget(cartSum, pend);

  $('#trip-list').innerHTML =
    dueHtml(pend) +
    (state.mode === 'store' ? byStoreHtml(pend) : byPriorityHtml(pend, cartSum)) +
    emptyHtml(pend, onTrip) +
    cartHtml(inCart, cartSum);

  if (focusPending && openId) {
    const input = $('.name-input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
  focusPending = false;
}

function dueHtml(pend) {
  const due = pend.filter(isDue);
  if (!due.length) return '';
  return '<div class="due-banner">' + due.length +
    (due.length > 1 ? ' things are' : ' thing is') + ' due again: ' +
    due.map((i) => esc(i.name)).sort().join(', ') +
    '</div>';
}

function byPriorityHtml(pend, cartSum) {
  // Flatten in display order, so the budget cutoff can be measured against it.
  const flat = [];
  for (const p of PRIORITIES) flat.push(...pend.filter((i) => i.priority === p).sort(byName));

  const budget = Number(state.budget) || 0;
  let running = cartSum, cutoffAt = -1;
  flat.forEach((item, i) => {
    running += lineTotal(item);
    if (cutoffAt === -1 && budget > 0 && running > budget) cutoffAt = i;
  });

  let html = '', idx = 0, drawn = false;
  for (const p of PRIORITIES) {
    const group = flat.filter((i) => i.priority === p);
    if (!group.length) continue;

    if (idx === cutoffAt && !drawn) { html += cutoffDivider(); drawn = true; }

    // Same tappable header as the Stores tab, so both tabs behave alike.
    const sum  = group.reduce((s, i) => s + lineTotal(i), 0);
    const open = !state.collapsedPri.includes(p);
    html += '<button class="group-head gh' + p + (open ? '' : ' collapsed') +
            '" data-pri="' + p + '">' +
            '<span><span class="caret">⌄</span>' + PRI_LABEL[p] + ' · ' + group.length +
            '</span>' +
            (sum > 0 ? '<span class="sum">' + money(sum) + '</span>' : '') + '</button>';

    if (!open) {
      // The items are still on the list, so they still spend the budget —
      // they just aren't drawn. If the money runs out inside a section you
      // can't see, put the line straight under its header.
      idx += group.length;
      if (!drawn && cutoffAt > -1 && idx > cutoffAt) { html += cutoffDivider(); drawn = true; }
      continue;
    }

    html += '<div class="card">';
    for (const item of group) {
      if (idx === cutoffAt && !drawn) {
        html += '</div>' + cutoffDivider() + '<div class="card">';
        drawn = true;
      }
      html += rowHtml(item);
      idx++;
    }
    html += '</div>';
  }
  return html;
}

function byStoreHtml(pend) {
  // Real stores alphabetically, "Other" always last.
  const stores = [...new Set(pend.flatMap(storesOf))]
    .sort((a, b) => (a === NO_STORE) - (b === NO_STORE) || a.localeCompare(b));

  let html = '';
  for (const store of stores) {
    // Inside a store, the most urgent things come first — same order as the
    // priority view, so a 1 is never buried under a 2.
    // An item tagged with two shops appears under both. Each heading's
    // total therefore answers "if I buy everything here, what does it cost" —
    // the figure at the top of the screen still counts each item once.
    const group = pend.filter((i) => storesOf(i).includes(store))
                      .sort((a, b) => a.priority - b.priority || byName(a, b));
    const isOpen = state.expanded.includes(store);
    const sum = group.reduce((s, i) => s + lineTotal(i), 0);

    html += '<button class="group-head' + (isOpen ? '' : ' collapsed') +
            '" data-store="' + esc(store) + '">' +
            '<span><span class="caret">⌄</span>' + esc(store) + ' · ' + group.length + '</span>' +
            (sum > 0 ? '<span class="sum">' + money(sum) + '</span>' : '') + '</button>';

    if (isOpen) html += '<div class="card">' + group.map(rowHtml).join('') + '</div>';
  }
  return html;
}

function cutoffDivider() {
  return '<div class="cutoff">budget runs out here</div>';
}

function rowHtml(item) {
  if (item.id === openId) return openRowHtml(item);

  const bits = [];
  if (item.qty > 1) bits.push('×' + item.qty);
  if (item.price)   bits.push(money(lineTotal(item)));
  // Two shops on one line gets long, so show the first and count the rest.
  if (item.stores.length && state.mode !== 'store') {
    bits.push(esc(item.stores[0]) +
              (item.stores.length > 1 ? ' +' + (item.stores.length - 1) : ''));
  }

  return '' +
    '<div class="swipe-wrap' + (item.priority === 3 ? ' will-delete' : '') + '">' +
      '<div class="swipe-bg">' +
        '<span class="sb-l">' + (item.done ? '↩ put back' : '✓ bought') + '</span>' +
        '<span class="sb-r">' + (item.priority === 3 ? 'delete' : 'send to Low') + '</span>' +
      '</div>' +
      // The priority is a colour stripe down the left edge rather than a
      // number — a "1" next to Chicken read like "buy one chicken".
      '<div class="row pri' + item.priority + (item.done ? ' done' : '') +
        '" data-id="' + item.id + '">' +
        '<button class="check" data-act="toggle-done" aria-label="Check off">✓</button>' +
        '<button class="row-main" data-act="open">' +
          '<span class="row-name">' + esc(item.name) + '</span>' +
          (bits.length ? '<span class="row-sub">' + bits.join(' · ') + '</span>' : '') +
          (item.note ? '<span class="row-note">' + esc(item.note) + '</span>' : '') +
          // A marker only. Deciding it is worth buying stays your job.
          (isDue(item) ? '<span class="row-due">Due again · last bought ' +
                         esc(item.lastBought) + '</span>' : '') +
        '</button>' +
      '</div>' +
    '</div>';
}

// The expanded row: name becomes editable, and the controls come to you.
function openRowHtml(item) {
  const pri = PRIORITIES.map((p) =>
    '<button class="pri v' + p + (item.priority === p ? ' on' : '') +
    '" data-act="set-priority" data-value="' + p + '">' + PRI_SHORT[p] + '</button>'
  ).join('');

  return '' +
    '<div class="row open pri' + item.priority + '" data-id="' + item.id + '">' +
      '<div class="open-head">' +
        '<button class="check" data-act="toggle-done" aria-label="Check off">✓</button>' +
        '<input class="name-input" data-field="name" value="' + esc(item.name) + '" ' +
          'enterkeyhint="done" autocomplete="off">' +
        '<button class="info-btn" data-act="info" aria-label="More details">i</button>' +
      '</div>' +
      '<div class="open-controls">' +
        '<div class="pri-group">' + pri + '</div>' +
        '<span class="ctrl-spacer"></span>' +
        '<input class="field field-price" data-field="price" type="number" min="0" ' +
          'step="0.01" inputmode="decimal" enterkeyhint="done" placeholder="' +
          CURRENCY + '" value="' + (item.price ?? '') + '">' +
      '</div>' +
      chipsHtml(item.stores, 'store-add') +
    '</div>';
}

/* A store chip: the name, and a × that takes it off. */
function chipHtml(name) {
  return '<span class="chip">' + esc(name) +
         '<button type="button" class="chip-x" data-act="chip-remove" ' +
         'data-value="' + esc(name) + '" aria-label="Remove ' + esc(name) + '">×</button></span>';
}

/* The whole box: the chips already on, then a text box for the next one.
   Enter or a comma turns what you have typed into a chip; so does tapping
   away. The chip is inserted straight into the page rather than through a
   redraw, so the keyboard never closes between two stores. */
function chipsHtml(stores, field, id) {
  return '<div class="chips"' + (id ? ' id="' + id + '"' : '') + '>' +
    stores.map(chipHtml).join('') +
    '<input class="chip-input" data-field="' + field + '" list="store-names" ' +
    'placeholder="' + (stores.length ? '+ store' : 'store') + '" ' +
    'autocomplete="off" autocapitalize="words" enterkeyhint="done"></div>';
}

function emptyHtml(pend, onTrip) {
  if (pend.length) return '';
  return '<p class="empty">' + (onTrip.length
    ? 'Everything is in the cart. 🎉<br>Tap <b>New trip</b> to uncheck it all for next time.'
    : 'Nothing on this trip yet.<br>Start typing above — the box remembers everything<br>you have bought before.')
    + '</p>';
}

function cartHtml(inCart, cartSum) {
  if (!inCart.length) return '';
  return '<div class="group-head"><span>In cart · ' + inCart.length + '</span>' +
         (cartSum > 0 ? '<span class="sum">' + money(cartSum) + '</span>' : '') + '</div>' +
         '<div class="card">' + inCart.map(rowHtml).join('') + '</div>';
}

/* The budget block stays hidden until at least one item has a price,
   so the app is useful from the very first item you type. */
function renderBudget(cartSum, pend) {
  const anyPrice = tripItems().some((i) => i.price);
  $('#budget').classList.toggle('hidden', !anyPrice);
  $('#budget').classList.toggle('compact', !state.budgetOpen);
  if (!anyPrice) return;

  const budget    = Number(state.budget) || 0;
  const projected = cartSum + pend.reduce((s, i) => s + lineTotal(i), 0);
  const noPrice   = pend.filter((i) => !i.price).length;

  // Closed, it answers the simple question: what is this shop going to cost?
  // A budget is entirely optional — you only meet it if you open the panel.
  $('#budget-cart').textContent = money(cartSum) + ' in cart';
  $('#budget-total').textContent = 'of ' + money(projected);
  if (document.activeElement !== $('#budget-input')) $('#budget-input').value = budget || '';

  const fill = $('#bar-fill');
  fill.style.width = (budget > 0 ? Math.min(100, (cartSum / budget) * 100) : 0) + '%';
  fill.classList.toggle('over', budget > 0 && cartSum > budget);

  let note, over = false;
  if (!budget) {
    note = 'Set a budget to see what fits.';
  } else if (cartSum > budget) {
    note = money(cartSum - budget) + ' over budget already.'; over = true;
  } else if (projected > budget) {
    note = 'The whole list comes to ' + money(projected) + ' — ' +
           money(projected - budget) + ' too much.'; over = true;
  } else {
    note = 'The whole list comes to ' + money(projected) + ' — it fits, with ' +
           money(budget - projected) + ' to spare.';
  }
  if (noPrice) note += ' (' + noPrice + ' item' + (noPrice > 1 ? 's have' : ' has') + ' no price yet.)';

  const el = $('#budget-note');
  el.textContent = note;
  el.classList.toggle('over', over);
}

/* ---------------------------------------------------------------
   5. Render
   --------------------------------------------------------------- */

function render() {
  document.querySelectorAll('.tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === state.mode));
  $('#version').textContent = 'version ' + VERSION;

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

  const priHead = event.target.closest('[data-pri]');
  if (priHead) {                               // collapse / expand a priority section
    const p = Number(priHead.dataset.pri);
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
      update(() => { item.done = !item.done; openId = null; });
      maybeCelebrate();
      break;

    case 'set-priority':
      // Change state but do NOT redraw — the row would jump away mid-edit.
      item.priority = Number(btn.dataset.value);
      save();
      btn.parentElement.querySelectorAll('.pri')
         .forEach((b) => b.classList.toggle('on', b === btn));
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
  if (input.dataset.field === 'name')  item.name  = v.trim() || item.name;
  // A chip box appends rather than replaces, and empties itself.
  if (input.dataset.field === 'store-add') {
    if (addStore(item, v)) {
      input.insertAdjacentHTML('beforebegin', chipHtml(item.stores[item.stores.length - 1]));
      input.placeholder = '+ store';
    }
    input.value = '';
  }
  if (input.dataset.field === 'price') {
    const n = parseFloat(v);
    item.price = Number.isFinite(n) && n >= 0 ? n : null;
  }
}

// Pull whatever is currently typed in the open row into state before redrawing.
function commitOpenRow() {
  if (!openId) return;
  const item = findItem(openId);
  if (!item) return;
  document.querySelectorAll('.row.open [data-field]').forEach((i) => applyField(item, i));
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

// Tapping anywhere outside the open row closes it.
document.addEventListener('click', (e) => {
  if (!openId) return;
  if (e.target.closest('.row.open') || e.target.closest('dialog')) return;
  if (e.target.closest('[data-act="open"]')) return;   // handled above
  commitOpenRow();
  closeRow();
});

/* ---------------- adding ---------------- */

/* How many single-letter changes turn one word into another. "ricw" and
   "rice" are one apart; "rice" and "beans" are miles apart. This is the
   whole misspelling check — no dictionary, just your own list. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 9;      // too different to bother
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

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

/* What the optional detail row is currently set to. When the row is shut
   it contributes nothing at all — priority comes back null, which means
   "leave it alone" rather than "make it Medium". Closing the row clears
   the boxes, so there is never a value acting on you that you can't see. */
function addFields() {
  if (!state.addOpen) return { pri: null, store: '', price: null };
  const on = $('#add-pri .on');
  const price = parseFloat($('#add-price').value);
  return {
    pri: on ? Number(on.dataset.addPri) : 2,
    store: $('#add-store').value.trim(),
    price: Number.isFinite(price) && price >= 0 ? price : null
  };
}

function clearAddBox() {
  $('#add-input').value = '';
  $('#add-price').value = '';       // a price belongs to one item, never the next
  setAddPri(2);                     // priority goes back to the default
  renderSuggestions();
  $('#add-input').focus();
}

function setAddPri(p) {
  document.querySelectorAll('#add-pri .pri').forEach((b) =>
    b.classList.toggle('on', Number(b.dataset.addPri) === p));
}

// Bring an item that already exists back onto this trip.
function reviveExisting(item, f) {
  update(() => {
    item.inTrip = true;
    item.done = false;
    if (f.pri !== null)  item.priority = f.pri;
    if (f.store)         addStore(item, f.store);
    if (f.price !== null) item.price = f.price;
  });
}

/* Exactly what tapping the main button would do to an item you already
   have. Anything that isn't listed here doesn't happen — no silent edits. */
function changeList(item, f) {
  const bits = [];
  if (f.pri !== null && f.pri !== item.priority) bits.push('move it to ' + PRI_LABEL[f.pri]);
  if (f.store && !item.stores.some((x) => x.toLowerCase() === f.store.toLowerCase())) {
    bits.push('add ' + f.store + ' to its stores');
  }
  if (f.price !== null && f.price !== item.price) bits.push('set its price to ' + money(f.price));
  if (item.done)                                  bits.push('uncheck it');
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
      stores: f.store ? [f.store] : [],
      price: f.price
    }));
  });
  // Deliberately does NOT open the new row or scroll to it — you should be
  // able to type ten items in a row without being dragged down the list.
  clearAddBox();
});

/* ---------------- the optional detail row ---------------- */
$('#add-price').placeholder = CURRENCY;

function renderAddMore() {
  $('#add-more').classList.toggle('hidden', !state.addOpen);
  $('#add-toggle').classList.toggle('collapsed', !state.addOpen);
  $('#add-toggle').setAttribute('aria-expanded', String(state.addOpen));
}

$('#add-toggle').addEventListener('click', () => {
  state.addOpen = !state.addOpen;
  // Shutting it empties it, so nothing can be set on an item from a box
  // you can no longer see.
  if (!state.addOpen) { $('#add-store').value = ''; $('#add-price').value = ''; setAddPri(2); }
  save();
  renderAddMore();
});

$('#add-pri').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-pri]');
  if (btn) setAddPri(Number(btn.dataset.addPri));
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
        (i.done ? 'in cart' : 'already on your list') +
      '</span>' +
    '</button>').join('');
  suggestBox.classList.remove('hidden');
}

suggestBox.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick-item]');
  if (!btn) return;
  const item = findItem(btn.dataset.pickItem);
  if (!item) return;
  // Tapping one means "I need this" — so bring it back out of the cart.
  update(() => { item.done = false; });
  $('#add-input').value = '';
  renderSuggestions();
  $('#add-input').focus();
});

$('#add-input').addEventListener('input', renderSuggestions);
$('#add-input').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { $('#add-input').value = ''; renderSuggestions(); }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.add-wrap')) suggestBox.classList.add('hidden');
});

/* ---------------- budget ---------------- */
$('#budget-input').addEventListener('input', (e) => {
  state.budget = Number(e.target.value) || 0;
  save();
  renderTrip();
});
$('#budget-toggle').addEventListener('click', () => {
  update(() => { state.budgetOpen = !state.budgetOpen; });
});

/* ---------------- view toggle ---------------- */


/* ---------------- finish trip ---------------- */
$('#new-trip').addEventListener('click', async () => {
  commitOpenRow();
  const bought = tripItems().filter((i) => i.done);

  if (!bought.length) {
    await ask('Nothing to reset',
              'Nothing is checked off yet, so there is nothing to clear.',
              { yes: 'OK', cancel: false });
    return;
  }

  const ok = await ask(
    'Start a new trip?',
    bought.length + (bought.length > 1 ? ' items get' : ' item gets') +
    ' marked as bought. Everything stays on your list — it just gets unchecked, ' +
    'ready for next time.',
    { yes: 'Start new trip', remember: 'newTrip' });
  if (!ok) return;

  const today = todayLocal();
  update(() => {
    for (const item of state.items) {
      if (item.done) {
        item.timesBought = (item.timesBought || 0) + 1;
        item.lastBought = today;
      }
      item.done = false;      // unchecked, but it stays on the list
    }
    openId = null;
  });
  wasComplete = false;
});

/* ---------------- tabs ---------------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    commitOpenRow();
    update(() => {
      state.mode = tab.dataset.mode;
      openId = null;
      if (state.mode === 'store') state.expanded = [];   // arrive with all stores shut
    });
    window.scrollTo(0, 0);
  });
});

/* ---------------- details sheet ---------------- */
const info = $('#info-dialog');
let infoId = null;
/* The sheet edits a copy, so pressing Cancel really does cancel. */
let infoStores = [];

function renderInfoChips() {
  $('#info-chips').outerHTML = chipsHtml(infoStores, 'info-store', 'info-chips');
}

$('#info-form').addEventListener('click', (e) => {
  const x = e.target.closest('[data-act="chip-remove"]');
  if (!x) return;
  const gone = x.dataset.value.toLowerCase();
  infoStores = infoStores.filter((s) => s.toLowerCase() !== gone);
  renderInfoChips();
});

$('#info-form').addEventListener('keydown', (e) => {
  const chip = e.target.closest('.chip-input');
  if (!chip || (e.key !== 'Enter' && e.key !== ',') || !chip.value.trim()) return;
  e.preventDefault();
  addStore({ stores: infoStores }, chip.value);   // pushes onto infoStores itself
  renderInfoChips();
  $('#info-chips .chip-input').focus();
});

function openInfo(item) {
  infoId = item.id;
  const f = $('#info-form');
  f.qty.value = item.qty || 1;
  f.price.value = item.price ?? '';
  infoStores = [...item.stores];
  renderInfoChips();
  f.repeatDays.value = item.repeatDays || '';
  markRepeatPill();
  f.note.value = item.note || '';
  $('#info-title').textContent = item.name;
  // Only worth a line if it actually tells you something.
  const lines = [];
  if (item.lastBought) lines.push('Last bought ' + item.lastBought);
  if (item.repeatDays && item.lastBought) {
    lines.push(isDue(item)
      ? 'Due again now.'
      : 'Due again on ' + addDays(item.lastBought, item.repeatDays) + '.');
  } else if (item.repeatDays) {
    lines.push('The countdown starts the first time you buy it.');
  }
  $('#info-stat').textContent = lines.join(' · ');
  $('#info-stat').classList.toggle('hidden', !lines.length);
  info.showModal();
}

/* The number box is the real setting; the buttons are shortcuts that fill
   it in. So "every 45 days" is typed, and nothing is highlighted — which is
   itself accurate, because no preset is what's set. */
function markRepeatPill() {
  const days = parseInt($('#info-form').repeatDays.value, 10) || 0;
  document.querySelectorAll('#repeat-pills .pill').forEach((b) =>
    b.classList.toggle('on', Number(b.dataset.days) === days));
}

$('#repeat-pills').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-days]');
  if (!btn) return;
  const days = Number(btn.dataset.days);
  $('#info-form').repeatDays.value = days > 0 ? days : '';
  markRepeatPill();
});

$('#info-form').repeatDays.addEventListener('input', markRepeatPill);

$('#info-cancel').addEventListener('click', () => info.close());

$('#info-form').addEventListener('submit', () => {
  const item = findItem(infoId);
  if (!item) return;
  const f = $('#info-form');
  const price = parseFloat(f.price.value);
  update(() => {
    item.qty = Math.max(1, parseInt(f.qty.value, 10) || 1);
    item.price = Number.isFinite(price) && price >= 0 ? price : null;
    addStore({ stores: infoStores }, $('#info-chips .chip-input').value);
    item.stores = infoStores;
    item.note = f.note.value.trim();
    const rep = parseInt(f.repeatDays.value, 10);
    item.repeatDays = Number.isFinite(rep) && rep > 0 ? rep : null;
  });
});



async function confirmDelete(item) {
  const ok = await ask('Delete "' + item.name + '"?',
                       'It goes for good. This is the only thing in the app that really ' +
                       'deletes something.',
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
   Swipe a row right to mark it bought, left to choose its store.
   Both actions also have ordinary buttons, so a gesture is never
   the only way to do something.
   --------------------------------------------------------------- */

const SWIPE_TRIGGER = 70;   // how far you must drag before it counts
let sw = null;
let justSwiped = false;

$('#trip-list').addEventListener('pointerdown', (e) => {
  justSwiped = false;
  if (e.pointerType === 'mouse' && e.button !== 0) return;

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
    update(() => { item.done = !item.done; });
    maybeCelebrate();
  } else if (dx <= -SWIPE_TRIGGER) {
    // Two stages: anything above Low gets demoted to Low. Only something
    // already sitting in Low is actually deleted — so a stray swipe can
    // never destroy something you cared about.
    if (item.priority === 3) confirmDelete(item);
    else update(() => { item.priority = 3; });
  }
}

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
renderAddMore();
render();

/* Cloud backup — see sync.js. Called once the page is already drawn, so
   a slow network never delays the list appearing.

   adoptFromCloud runs only when the cloud copy is NEWER than this
   phone's: a wiped Safari, or a new phone. The list being replaced is
   stashed under its own key first, so nothing is ever truly gone. */
function adoptFromCloud(data) {
  if (!data || !Array.isArray(data.items)) return;
  try { localStorage.setItem('groceries.v2.replaced', JSON.stringify(state)); }
  catch (err) { /* the stash is a nicety, not a requirement */ }

  state = data;
  // An older save may predate some fields, exactly as load() guards for.
  if (!Array.isArray(state.expanded))  state.expanded  = [];
  if (!Array.isArray(state.collapsedPri)) state.collapsedPri = [];
  if (typeof state.addOpen !== 'boolean') state.addOpen = false;
  if (typeof state.budgetOpen !== 'boolean') state.budgetOpen = false;
  if (!state.skipAsk || typeof state.skipAsk !== 'object') state.skipAsk = {};
  state.items.forEach(normaliseItem);

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Could not save the restored list.', err); }
  render();
}

if (window.Cloud) Cloud.start(adoptFromCloud, () => state);
