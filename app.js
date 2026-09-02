/* =================================================================
   To buy list — v2.9

   The idea in one sentence: an item is never deleted when you buy
   it, it just leaves this trip and waits in All items for next week.

   Every item carries two separate flags:
     inTrip  – is it on this week's list?
     done    – have I put it in the cart on THIS trip?
   "Finish trip" clears both. The item itself survives.
   ================================================================= */

const VERSION     = '3.1';
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
    store: '',          // free text — '' means "haven't said"
    priority: 2,
    price: null,        // null means "haven't said what it costs"
    qty: 1,
    note: '',
    inTrip: true,
    done: false,
    timesBought: 0,
    lastBought: null,
    ...extra
  };
}

function seedState() {
  return {
    schema: 2, budget: 0, mode: 'priority',
    expanded: [],        // which store groups are open — none, to begin with
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
    budgetOpen: false,
    skipAsk: {},
    items: (old.items || []).map((i) => ({
      ...newItem(i.name),
      id: i.id,
      store: '',
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
        if (typeof parsed.budgetOpen !== 'boolean') parsed.budgetOpen = false;
        if (!parsed.skipAsk || typeof parsed.skipAsk !== 'object') parsed.skipAsk = {};
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

const lineTotal = (item) => (item.price || 0) * (item.qty || 1);
const byName    = (a, b) => a.name.localeCompare(b.name);
const findItem  = (id) => state.items.find((i) => i.id === id);
const tripItems = () => state.items.filter((i) => i.inTrip);
const storeOf   = (item) => item.store.trim() || NO_STORE;

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
    (state.mode === 'store' ? byStoreHtml(pend) : byPriorityHtml(pend, cartSum)) +
    emptyHtml(pend, onTrip) +
    cartHtml(inCart, cartSum);

  if (focusPending && openId) {
    const input = $('.name-input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
  focusPending = false;
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

    const sum = group.reduce((s, i) => s + lineTotal(i), 0);
    html += '<div class="group-head gh' + p + '"><span>' + PRI_LABEL[p] + '</span>' +
            (sum > 0 ? '<span class="sum">' + money(sum) + '</span>' : '') + '</div>';
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
  const stores = [...new Set(pend.map(storeOf))]
    .sort((a, b) => (a === NO_STORE) - (b === NO_STORE) || a.localeCompare(b));

  let html = '';
  for (const store of stores) {
    // Inside a store, the most urgent things come first — same order as the
    // priority view, so a 1 is never buried under a 2.
    const group = pend.filter((i) => storeOf(i) === store)
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
  if (item.store.trim() && state.mode !== 'store') bits.push(esc(item.store));

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
        '<input class="field field-store" data-field="store" list="store-names" ' +
          'placeholder="store" value="' + esc(item.store) + '" autocomplete="off" ' +
          'enterkeyhint="done">' +
        '<input class="field field-price" data-field="price" type="number" min="0" ' +
          'step="0.01" inputmode="decimal" enterkeyhint="done" placeholder="' +
          CURRENCY + '" value="' + (item.price ?? '') + '">' +
      '</div>' +
    '</div>';
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
    [...new Set(state.items.map((i) => i.store.trim()).filter(Boolean))].sort()
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

function ask(title, body, { yes = 'OK', danger = false, cancel = true, remember = null } = {}) {
  // Already told us not to ask? Then don't — just say yes and get on with it.
  if (remember && state.skipAsk[remember]) return Promise.resolve(true);

  return new Promise((resolve) => {
    $('#ask-title').textContent = title;
    $('#ask-body').textContent = body;
    const yesBtn = $('#ask-yes');
    yesBtn.textContent = yes;
    yesBtn.classList.toggle('solid-danger', danger);
    $('#ask-no').classList.toggle('hidden', !cancel);

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
  if (input.dataset.field === 'store') item.store = v.trim();
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
$('#add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#add-input');
  const name = input.value.trim();
  if (!name) return;

  const existing = state.items.find((i) => i.name.toLowerCase() === name.toLowerCase());
  let created = null;

  update(() => {
    if (existing) {
      existing.inTrip = true;
      existing.done = false;
    } else {
      created = newItem(name);
      state.items.push(created);
    }
  });

  input.value = '';
  renderSuggestions();
  // Deliberately does NOT open the new row or scroll to it — you should be
  // able to type ten items in a row without being dragged down the list.
  input.focus();
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

function openInfo(item) {
  infoId = item.id;
  const f = $('#info-form');
  f.qty.value = item.qty || 1;
  f.price.value = item.price ?? '';
  f.store.value = item.store || '';
  f.note.value = item.note || '';
  $('#info-title').textContent = item.name;
  // Only worth a line if it actually tells you something.
  $('#info-stat').textContent = item.lastBought ? 'Last bought ' + item.lastBought : '';
  $('#info-stat').classList.toggle('hidden', !item.lastBought);
  info.showModal();
}

$('#info-cancel').addEventListener('click', () => info.close());

$('#info-form').addEventListener('submit', () => {
  const item = findItem(infoId);
  if (!item) return;
  const f = $('#info-form');
  const price = parseFloat(f.price.value);
  update(() => {
    item.qty = Math.max(1, parseInt(f.qty.value, 10) || 1);
    item.price = Number.isFinite(price) && price >= 0 ? price : null;
    item.store = f.store.value.trim();
    item.note = f.note.value.trim();
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
  // A thing thrown upward reaches a height of v² / 2g, so to peak around the
  // middle of the screen we need a starting speed of roughly √(g × H).
  const gravity = 0.7 * dpr;
  const launch  = Math.sqrt(gravity * H);

  const colours = ['#d7263d', '#f0a83c', '#2f6df6', '#27a266', '#9b59b6', '#ff6b7d'];
  const bits = [];
  for (let i = 0; i < 120; i++) {
    bits.push({
      x: Math.random() * W,
      y: H + Math.random() * 40 * dpr,
      vx: (Math.random() - 0.5) * 7 * dpr,
      vy: -launch * (0.78 + Math.random() * 0.44),   // some go higher than others
      w: (5 + Math.random() * 6) * dpr,
      h: (8 + Math.random() * 9) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      colour: colours[i % colours.length]
    });
  }

  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
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
    // stop once everything has fallen back past the bottom
    if (frame < 220 && bits.some((b) => b.y < H + 60 * dpr)) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}

/* ---------------- go ---------------- */
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
  if (typeof state.budgetOpen !== 'boolean') state.budgetOpen = false;
  if (!state.skipAsk || typeof state.skipAsk !== 'object') state.skipAsk = {};

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (err) { console.warn('Could not save the restored list.', err); }
  render();
}

if (window.Cloud) Cloud.start(adoptFromCloud, () => state);
