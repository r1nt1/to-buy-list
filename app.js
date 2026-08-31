/* =================================================================
   Groceries — v2.1

   The idea in one sentence: an item is never deleted when you buy
   it, it just leaves this trip and waits in All items for next week.

   Every item carries two separate flags:
     inTrip  – is it on this week's list?
     done    – have I put it in the cart on THIS trip?
   "Finish trip" clears both. The item itself survives.
   ================================================================= */

const VERSION     = '2.1';
const STORAGE_KEY = 'groceries.v2';
const OLD_KEY     = 'groceries.v1';   // read once, to carry old data forward

// Change this if you want a different currency, e.g. '$' or '€'.
const CURRENCY = 'S/';

const PRIORITIES = [1, 2, 3];
const PRI_LABEL  = { 1: 'Must have', 2: 'Should get', 3: 'Nice to have' };
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
    schema: 2, budget: 0, mode: 'priority', collapsed: [],
    budgetCompact: false,
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
    collapsed: [],
    budgetCompact: false,
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
      if (parsed && parsed.schema === 2 && Array.isArray(parsed.items)) return parsed;
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
    const group = pend.filter((i) => storeOf(i) === store).sort(byName);
    const isCollapsed = state.collapsed.includes(store);
    const sum = group.reduce((s, i) => s + lineTotal(i), 0);

    html += '<button class="group-head' + (isCollapsed ? ' collapsed' : '') +
            '" data-store="' + esc(store) + '">' +
            '<span><span class="caret">⌄</span>' + esc(store) + ' · ' + group.length + '</span>' +
            (sum > 0 ? '<span class="sum">' + money(sum) + '</span>' : '') + '</button>';

    if (!isCollapsed) {
      html += '<div class="card">' + group.map(rowHtml).join('') + '</div>';
    }
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
  if (item.note)    bits.push('📝');

  return '' +
    '<div class="swipe-wrap">' +
      '<div class="swipe-bg">' +
        '<span class="sb-l">' + (item.done ? '↩ put back' : '✓ bought') + '</span>' +
        '<span class="sb-r">store ⌂</span>' +
      '</div>' +
      '<div class="row' + (item.done ? ' done' : '') + '" data-id="' + item.id + '">' +
        '<button class="check" data-act="toggle-done" aria-label="Check off">✓</button>' +
        '<button class="row-main" data-act="open">' +
          '<span class="row-name">' + esc(item.name) + '</span>' +
          (bits.length ? '<span class="row-sub">' + bits.join(' · ') + '</span>' : '') +
        '</button>' +
        '<button class="badge p' + item.priority + '" data-act="open">' + item.priority + '</button>' +
      '</div>' +
    '</div>';
}

// The expanded row: name becomes editable, and the controls come to you.
function openRowHtml(item) {
  const pri = PRIORITIES.map((p) =>
    '<button class="pri v' + p + (item.priority === p ? ' on' : '') +
    '" data-act="set-priority" data-value="' + p + '">' + p + '</button>'
  ).join('');

  return '' +
    '<div class="row open" data-id="' + item.id + '">' +
      '<div class="open-head">' +
        '<button class="check" data-act="toggle-done" aria-label="Check off">✓</button>' +
        '<input class="name-input" data-field="name" value="' + esc(item.name) + '" ' +
          'enterkeyhint="done" autocomplete="off">' +
        '<button class="info-btn" data-act="info" aria-label="More details">i</button>' +
      '</div>' +
      '<div class="open-controls">' +
        '<div class="pri-group">' + pri + '</div>' +
        '<input class="field field-store" data-field="store" list="store-names" ' +
          'placeholder="store" value="' + esc(item.store) + '" autocomplete="off">' +
        '<input class="field field-price" data-field="price" type="number" min="0" ' +
          'step="0.01" inputmode="decimal" placeholder="' + CURRENCY + '" value="' +
          (item.price ?? '') + '">' +
      '</div>' +
    '</div>';
}

function emptyHtml(pend, onTrip) {
  if (pend.length) return '';
  return '<p class="empty">' + (onTrip.length
    ? 'Everything on the list is in the cart. 🎉<br>Tap <b>Finish trip</b> when you check out.'
    : 'Nothing on this trip yet.<br>Add something above, or pull your usuals from All items.')
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
  $('#budget').classList.toggle('compact', !!state.budgetCompact);
  if (!anyPrice) return;

  const budget    = Number(state.budget) || 0;
  const projected = cartSum + pend.reduce((s, i) => s + lineTotal(i), 0);
  const noPrice   = pend.filter((i) => !i.price).length;

  $('#budget-cart').textContent = money(cartSum) + ' in cart';
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
   4. All items view
   --------------------------------------------------------------- */

function renderAll() {
  const query = $('#search').value.trim().toLowerCase();
  const all = state.items.filter((i) =>
    !query || i.name.toLowerCase().includes(query) || i.store.toLowerCase().includes(query));

  $('#all-count').textContent =
    state.items.length + (state.items.length === 1 ? ' item' : ' items');
  $('#version').textContent = 'version ' + VERSION;

  const usual = [...state.items]
    .filter((i) => i.timesBought > 0)
    .sort((a, b) => b.timesBought - a.timesBought || byName(a, b))
    .slice(0, 8);

  $('#usual').innerHTML = usual.length && !query
    ? '<div class="group-head"><span>Usual suspects</span></div><div class="pills">' +
      usual.map((i) => '<button class="pill' + (i.inTrip ? ' on' : '') + '" data-id="' + i.id +
                       '" data-act="toggle-trip">' + esc(i.name) + '</button>').join('') +
      '</div>'
    : '';

  const stores = [...new Set(all.map(storeOf))]
    .sort((a, b) => (a === NO_STORE) - (b === NO_STORE) || a.localeCompare(b));

  let html = '';
  for (const store of stores) {
    const group = all.filter((i) => storeOf(i) === store).sort(byName);
    html += '<div class="group-head"><span>' + esc(store) + '</span></div><div class="card">';
    for (const item of group) {
      const bits = [
        item.price ? money(item.price) + ' each' : 'no price yet',
        item.timesBought ? 'bought ' + item.timesBought + '×' : 'never bought yet'
      ];
      html +=
        '<div class="row" data-id="' + item.id + '">' +
          '<button class="check add-toggle' + (item.inTrip ? ' on' : '') + '" ' +
            'data-act="toggle-trip" aria-label="' +
            (item.inTrip ? 'Remove from this trip' : 'Add to this trip') + '">' +
            (item.inTrip ? '✓' : '+') + '</button>' +
          '<button class="row-main" data-act="info">' +
            '<span class="row-name">' + esc(item.name) + '</span>' +
            '<span class="row-sub">' + bits.join(' · ') + '</span>' +
          '</button>' +
          '<button class="badge p' + item.priority + '" data-act="info">' +
            item.priority + '</button>' +
        '</div>';
    }
    html += '</div>';
  }

  if (!all.length) {
    html = '<p class="empty">' +
      (query ? 'Nothing matches &ldquo;' + esc(query) + '&rdquo;.' : 'No items yet.') + '</p>';
  }
  $('#all-list').innerHTML = html;
}

/* ---------------------------------------------------------------
   5. Render
   --------------------------------------------------------------- */

function render() {
  document.querySelectorAll('.seg').forEach((b) =>
    b.classList.toggle('on', b.dataset.mode === state.mode));

  renderTrip();
  renderAll();

  $('#item-names').innerHTML = [...state.items].sort(byName)
    .map((i) => '<option value="' + esc(i.name) + '">').join('');

  // Autocomplete for the store box — every store you have ever typed.
  $('#store-names').innerHTML =
    [...new Set(state.items.map((i) => i.store.trim()).filter(Boolean))].sort()
      .map((s) => '<option value="' + esc(s) + '">').join('');
}

/* ---------------------------------------------------------------
   6. Actions
   --------------------------------------------------------------- */

function handleClick(event) {
  if (justSwiped) { justSwiped = false; return; }
  const head = event.target.closest('[data-store]');
  if (head) {                                  // collapse / expand a store group
    const store = head.dataset.store;
    update(() => {
      state.collapsed = state.collapsed.includes(store)
        ? state.collapsed.filter((s) => s !== store)
        : [...state.collapsed, store];
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

['#trip-list', '#all-list', '#usual'].forEach((sel) => {
  $(sel).addEventListener('click', handleClick);
  $(sel).addEventListener('change', handleFieldChange);
});

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
  // A brand-new item opens straight away, ready to be prioritized.
  if (created) openRow(created.id); else input.focus();
});

/* ---------------- budget ---------------- */
$('#budget-input').addEventListener('input', (e) => {
  state.budget = Number(e.target.value) || 0;
  save();
  renderTrip();
});
$('#budget-toggle').addEventListener('click', () => {
  update(() => { state.budgetCompact = !state.budgetCompact; });
});

/* ---------------- view toggle ---------------- */
$('#view-toggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.seg');
  if (!btn) return;
  commitOpenRow();
  update(() => { state.mode = btn.dataset.mode; openId = null; });
});

$('#search').addEventListener('input', renderAll);

/* ---------------- finish trip ---------------- */
$('#finish-trip').addEventListener('click', () => {
  commitOpenRow();
  const bought = tripItems().filter((i) => i.done);
  if (!bought.length) {
    alert('Nothing is checked off yet, so there is no trip to finish.');
    return;
  }
  if (!confirm('Finish this trip?\n\n' + bought.length + ' item' +
      (bought.length > 1 ? 's' : '') + ' bought.\n\n' +
      'Everything clears off the list but stays in All items, ready for next time.')) return;

  const today = todayLocal();
  update(() => {
    for (const item of state.items) {
      if (item.inTrip && item.done) {
        item.timesBought = (item.timesBought || 0) + 1;
        item.lastBought = today;
      }
      item.inTrip = false;
      item.done = false;
    }
    openId = null;
  });
});

/* ---------------- tabs ---------------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    commitOpenRow();
    closeRow();
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $('#view-trip').classList.toggle('hidden', tab.dataset.tab !== 'trip');
    $('#view-all').classList.toggle('hidden',  tab.dataset.tab !== 'all');
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
  f.note.value = item.note || '';
  $('#info-title').textContent = item.name;
  $('#info-stat').textContent = item.timesBought
    ? 'Bought ' + item.timesBought + ' time' + (item.timesBought > 1 ? 's' : '') +
      (item.lastBought ? ', last on ' + item.lastBought : '') + '.'
    : 'Never bought yet.';
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
    item.note = f.note.value.trim();
  });
});

$('#info-delete').addEventListener('click', () => {
  const item = findItem(infoId);
  if (!item) return;
  if (!confirm('Delete "' + item.name + '" for good?\n\n' +
               'This is the only thing in the app that really deletes something.')) return;
  update(() => {
    state.items = state.items.filter((i) => i.id !== infoId);
    openId = null;
  });
  info.close();
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
  } else if (dx <= -SWIPE_TRIGGER) {
    openStorePicker(item);
  }
}

window.addEventListener('pointerup', endSwipe);
window.addEventListener('pointercancel', endSwipe);

/* ---------------------------------------------------------------
   8. Store picker (opened by a left swipe)
   --------------------------------------------------------------- */

const storeDlg = $('#store-dialog');
let storeId = null;

function knownStores() {
  return [...new Set(state.items.map((i) => i.store.trim()).filter(Boolean))].sort();
}

function openStorePicker(item) {
  storeId = item.id;
  const stores = knownStores();
  $('#store-title').textContent = item.name;
  $('#store-options').innerHTML = stores.length
    ? stores.map((st) => '<button type="button" class="pill' +
        (item.store.trim() === st ? ' on' : '') + '" data-pick="' + esc(st) + '">' +
        esc(st) + '</button>').join('')
    : '<p class="stat">No stores yet — type one below.</p>';
  $('#store-form').newstore.value = '';
  storeDlg.showModal();
}

$('#store-options').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  const item = findItem(storeId);
  if (!item) return;
  update(() => { item.store = btn.dataset.pick; });
  storeDlg.close();
});

$('#store-form').addEventListener('submit', () => {
  const item = findItem(storeId);
  if (!item) return;
  const typed = $('#store-form').newstore.value.trim();
  if (typed) update(() => { item.store = typed; });
});

$('#store-clear').addEventListener('click', () => {
  const item = findItem(storeId);
  if (item) update(() => { item.store = ''; });
  storeDlg.close();
});

$('#store-cancel').addEventListener('click', () => storeDlg.close());

/* ---------------- go ---------------- */
render();
