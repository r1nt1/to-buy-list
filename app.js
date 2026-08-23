/* =================================================================
   Groceries — Pantry & Trip

   The whole idea of this app in one sentence:
   an item is never deleted when you buy it, it just leaves this
   week's trip and waits in the Pantry for next week.

   Every item therefore carries two separate flags:
     inTrip  – is it on this week's shopping list?
     done    – have I put it in the cart on THIS trip?
   "Finish trip" clears both. The item itself survives.
   ================================================================= */

const STORAGE_KEY = 'groceries.v1';

const PRIORITIES   = ['must', 'should', 'maybe'];
const GROUP_LABEL  = { must: 'Must have', should: 'Should get', maybe: 'Nice to have' };
const CHIP_LABEL   = { must: 'Must', should: 'Should', maybe: 'Maybe' };

/* ---------------------------------------------------------------
   1. State — loading and saving
   --------------------------------------------------------------- */

function newItem(name, extra = {}) {
  return {
    id: Math.random().toString(36).slice(2, 9),
    name,
    category: 'Other',
    priority: 'should',
    price: null,        // null means "I haven't said what this costs"
    qty: 1,
    inTrip: true,
    done: false,
    timesBought: 0,
    lastBought: null,
    ...extra
  };
}

function seedState() {
  return {
    schema: 1,
    budget: 120,
    items: [
      newItem('Rice',     { category: 'Pantry staples', priority: 'must',   price: 3.50 }),
      newItem('Potatoes', { category: 'Produce',        priority: 'must',   price: 4.00 }),
      newItem('Chicken',  { category: 'Meat',           priority: 'must',   price: 9.00 }),
      newItem('Olive oil',{ category: 'Pantry staples', priority: 'should', price: 12.00 }),
      newItem('Ice cream',{ category: 'Frozen',         priority: 'maybe',  price: 6.50 })
    ]
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schema !== 1 || !Array.isArray(parsed.items)) return seedState();
    return parsed;
  } catch (err) {
    // Corrupt or unreadable data should never leave you staring at a blank screen.
    console.warn('Saved data could not be read, starting fresh.', err);
    return seedState();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save.', err);
  }
}

let state = load();

/* ---------------------------------------------------------------
   2. Small helpers
   --------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);

const money = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2);

// Anything typed by the user gets escaped before it goes into HTML,
// otherwise a name containing < or > would break the page.
function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Today's date in YOUR timezone. toISOString() would give UTC, which in the
// evening is already tomorrow — that would stamp items with the wrong day.
function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

const lineTotal  = (item) => (item.price || 0) * (item.qty || 1);
const byName     = (a, b) => a.name.localeCompare(b.name);
const findItem   = (id) => state.items.find((i) => i.id === id);
const tripItems  = () => state.items.filter((i) => i.inTrip);

function update(fn) {   // change state, save it, redraw — always together
  fn();
  save();
  render();
}

/* ---------------------------------------------------------------
   3. Trip view
   --------------------------------------------------------------- */

function renderTrip() {
  const onTrip  = tripItems();
  const inCart  = onTrip.filter((i) => i.done).sort(byName);
  const cartSum = inCart.reduce((sum, i) => sum + lineTotal(i), 0);

  // Pending items, flattened in the order they appear on screen.
  // The flat order is what the budget cutoff line is measured against.
  const pending = [];
  for (const p of PRIORITIES) {
    pending.push(...onTrip.filter((i) => !i.done && i.priority === p).sort(byName));
  }

  renderBudget(cartSum, pending);

  const budget = Number(state.budget) || 0;
  let running  = cartSum;
  let cutoffAt = -1;                       // index of the first item that won't fit
  pending.forEach((item, idx) => {
    running += lineTotal(item);
    if (cutoffAt === -1 && budget > 0 && running > budget) cutoffAt = idx;
  });

  let html = '';
  let idx  = 0;
  let cutoffDrawn = false;   // the divider is drawn once and only once

  for (const p of PRIORITIES) {
    const group = pending.slice(idx).filter((i) => i.priority === p);
    if (!group.length) continue;

    // If the budget runs out exactly at this group's first item, the divider
    // goes above the whole heading rather than inside an empty card.
    if (idx === cutoffAt && !cutoffDrawn) {
      html += cutoffDivider();
      cutoffDrawn = true;
    }

    const sum = group.reduce((s, i) => s + lineTotal(i), 0);
    html += '<div class="group-head"><span>' + GROUP_LABEL[p] + '</span>' +
            (sum > 0 ? '<span class="sum">' + money(sum) + '</span>' : '') + '</div>';
    html += '<div class="card">';
    for (const item of group) {
      if (idx === cutoffAt && !cutoffDrawn) {
        html += '</div>' + cutoffDivider() + '<div class="card">';
        cutoffDrawn = true;
      }
      html += tripRow(item);
      idx++;
    }
    html += '</div>';
  }

  if (!pending.length) {
    html += '<p class="empty">' + (onTrip.length
      ? 'Everything on the list is in the cart. 🎉<br>Tap <b>Finish trip</b> when you check out.'
      : 'Nothing on this week&rsquo;s list yet.<br>Add something above, or pull your usuals from the Pantry.')
      + '</p>';
  }

  if (inCart.length) {
    html += '<div class="group-head"><span>In cart · ' + inCart.length + '</span>' +
            '<span class="sum">' + money(cartSum) + '</span></div><div class="card">';
    for (const item of inCart) html += tripRow(item);
    html += '</div>';
  }

  $('#trip-list').innerHTML = html;
}

function cutoffDivider() {
  return '<div class="cutoff">budget runs out here</div>';
}

function tripRow(item) {
  const bits = [];
  if (item.qty > 1)   bits.push('×' + item.qty);
  if (item.price)     bits.push(money(lineTotal(item)));
  else                bits.push('no price yet');
  if (item.category)  bits.push(esc(item.category));

  return '' +
    '<div class="row' + (item.done ? ' done' : '') + '" data-id="' + item.id + '">' +
      '<button class="check" data-act="toggle-done" aria-label="Check off">✓</button>' +
      '<button class="row-main" data-act="edit">' +
        '<span class="row-name">' + esc(item.name) + '</span>' +
        '<span class="row-sub">' + bits.join(' · ') + '</span>' +
      '</button>' +
      '<button class="chip ' + item.priority + '" data-act="cycle-priority">' +
        CHIP_LABEL[item.priority] +
      '</button>' +
    '</div>';
}

function renderBudget(cartSum, pending) {
  const budget    = Number(state.budget) || 0;
  const plannedIn = pending.reduce((s, i) => s + lineTotal(i), 0);
  const projected = cartSum + plannedIn;
  const noPrice   = pending.filter((i) => !i.price).length;

  $('#budget-cart').textContent = money(cartSum) + ' in cart';
  if (document.activeElement !== $('#budget-input')) $('#budget-input').value = budget || '';

  const pct  = budget > 0 ? Math.min(100, (cartSum / budget) * 100) : 0;
  const fill = $('#bar-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('over', budget > 0 && cartSum > budget);

  let note, over = false;
  if (!budget) {
    note = 'Set a budget to see what fits.';
  } else if (cartSum > budget) {
    note = money(cartSum - budget) + ' over budget already.';
    over = true;
  } else if (projected > budget) {
    note = 'The whole list comes to ' + money(projected) + ' — ' +
           money(projected - budget) + ' too much.';
    over = true;
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
   4. Pantry view
   --------------------------------------------------------------- */

function renderPantry() {
  const query = $('#pantry-search').value.trim().toLowerCase();
  const all   = state.items.filter((i) => !query || i.name.toLowerCase().includes(query));

  $('#pantry-count').textContent =
    state.items.length + (state.items.length === 1 ? ' item' : ' items');

  // "Usual suspects" — what you buy most often, one tap to add to the trip.
  const usual = [...state.items]
    .filter((i) => i.timesBought > 0)
    .sort((a, b) => b.timesBought - a.timesBought || byName(a, b))
    .slice(0, 8);

  $('#usual').innerHTML = usual.length && !query
    ? '<div class="group-head"><span>Usual suspects</span></div><div class="pills">' +
      usual.map((i) =>
        '<button class="pill' + (i.inTrip ? ' on' : '') + '" data-id="' + i.id +
        '" data-act="toggle-trip">' + esc(i.name) + '</button>'
      ).join('') + '</div>'
    : '';

  // Everything else, grouped by category.
  const cats = [...new Set(all.map((i) => i.category || 'Other'))].sort();
  let html = '';

  for (const cat of cats) {
    const group = all.filter((i) => (i.category || 'Other') === cat).sort(byName);
    html += '<div class="group-head"><span>' + esc(cat) + '</span></div><div class="card">';
    for (const item of group) {
      const bits = [];
      bits.push(item.price ? money(item.price) + ' each' : 'no price yet');
      bits.push(item.timesBought ? 'bought ' + item.timesBought + '×' : 'never bought yet');
      html +=
        '<div class="row' + '" data-id="' + item.id + '">' +
          '<button class="check add-toggle' + (item.inTrip ? ' on' : '') + '" ' +
            'data-act="toggle-trip" aria-label="' +
            (item.inTrip ? 'Remove from this trip' : 'Add to this trip') + '">' +
            (item.inTrip ? '✓' : '+') + '</button>' +
          '<button class="row-main" data-act="edit">' +
            '<span class="row-name">' + esc(item.name) + '</span>' +
            '<span class="row-sub">' + bits.join(' · ') + '</span>' +
          '</button>' +
          '<button class="chip ' + item.priority + '" data-act="cycle-priority">' +
            CHIP_LABEL[item.priority] + '</button>' +
        '</div>';
    }
    html += '</div>';
  }

  if (!all.length) {
    html = '<p class="empty">' + (query ? 'Nothing matches &ldquo;' + esc(query) + '&rdquo;.'
                                        : 'Your pantry is empty.') + '</p>';
  }

  $('#pantry-list').innerHTML = html;
}

/* ---------------------------------------------------------------
   5. Render everything
   --------------------------------------------------------------- */

function render() {
  renderTrip();
  renderPantry();

  // Autocomplete sources for the "add" box and the category field.
  $('#pantry-names').innerHTML =
    [...state.items].sort(byName)
      .map((i) => '<option value="' + esc(i.name) + '">').join('');
  $('#category-names').innerHTML =
    [...new Set(state.items.map((i) => i.category).filter(Boolean))].sort()
      .map((c) => '<option value="' + esc(c) + '">').join('');
}

/* ---------------------------------------------------------------
   6. Actions
   --------------------------------------------------------------- */

// One click handler for every row in the app, rather than one per button.
// The button says what it wants via data-act; the row says which item.
function handleRowClick(event) {
  const btn = event.target.closest('[data-act]');
  if (!btn) return;
  const holder = btn.closest('[data-id]') || btn;
  const item   = findItem(holder.dataset.id);
  if (!item) return;

  switch (btn.dataset.act) {
    case 'toggle-done':
      update(() => { item.done = !item.done; });
      break;

    case 'cycle-priority': {
      const next = (PRIORITIES.indexOf(item.priority) + 1) % PRIORITIES.length;
      update(() => { item.priority = PRIORITIES[next]; });
      break;
    }

    case 'toggle-trip':
      update(() => {
        item.inTrip = !item.inTrip;
        if (!item.inTrip) item.done = false;
      });
      break;

    case 'edit':
      openEditor(item);
      break;
  }
}

$('#trip-list').addEventListener('click', handleRowClick);
$('#pantry-list').addEventListener('click', handleRowClick);
$('#usual').addEventListener('click', handleRowClick);

// Add box: an existing pantry item is pulled onto the trip, a new name is created.
$('#add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#add-input');
  const name  = input.value.trim();
  if (!name) return;

  const existing = state.items.find(
    (i) => i.name.toLowerCase() === name.toLowerCase()
  );

  update(() => {
    if (existing) {
      existing.inTrip = true;
      existing.done   = false;
    } else {
      state.items.push(newItem(name));
    }
  });

  input.value = '';
  input.focus();
});

$('#budget-input').addEventListener('input', (e) => {
  state.budget = Number(e.target.value) || 0;
  save();
  renderTrip();
});

$('#pantry-search').addEventListener('input', renderPantry);

// Finish trip — the heart of the app. Nothing is deleted.
$('#finish-trip').addEventListener('click', () => {
  const bought = tripItems().filter((i) => i.done);
  if (!bought.length) {
    alert('Nothing is checked off yet, so there is no trip to finish.');
    return;
  }
  const ok = confirm(
    'Finish this trip?\n\n' +
    bought.length + ' item' + (bought.length > 1 ? 's' : '') + ' bought.\n\n' +
    'Everything clears off the list but stays in your Pantry, ready for next week.'
  );
  if (!ok) return;

  const today = todayLocal();
  update(() => {
    for (const item of state.items) {
      if (item.inTrip && item.done) {
        item.timesBought = (item.timesBought || 0) + 1;
        item.lastBought  = today;
      }
      item.inTrip = false;
      item.done   = false;
    }
  });
});

/* ---------------- tabs ---------------- */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $('#view-trip').classList.toggle('hidden',   tab.dataset.tab !== 'trip');
    $('#view-pantry').classList.toggle('hidden', tab.dataset.tab !== 'pantry');
    window.scrollTo(0, 0);
  });
});

/* ---------------- edit sheet ---------------- */
const dialog = $('#edit-dialog');
let editingId = null;

function openEditor(item) {
  editingId = item.id;
  const f = $('#edit-form');
  f.name.value     = item.name;
  f.category.value = item.category || '';
  f.price.value    = item.price ?? '';
  f.qty.value      = item.qty || 1;
  f.priority.value = item.priority;

  $('#edit-stat').textContent = item.timesBought
    ? 'Bought ' + item.timesBought + ' time' + (item.timesBought > 1 ? 's' : '') +
      (item.lastBought ? ', last on ' + item.lastBought : '') + '.'
    : 'Never bought yet.';

  dialog.showModal();
}

$('#edit-cancel').addEventListener('click', () => dialog.close());

$('#edit-form').addEventListener('submit', () => {
  const item = findItem(editingId);
  if (!item) return;
  const f = $('#edit-form');
  const price = parseFloat(f.price.value);

  update(() => {
    item.name     = f.name.value.trim() || item.name;
    item.category = f.category.value.trim() || 'Other';
    item.price    = Number.isFinite(price) && price >= 0 ? price : null;
    item.qty      = Math.max(1, parseInt(f.qty.value, 10) || 1);
    item.priority = f.priority.value;
  });
});

$('#edit-delete').addEventListener('click', () => {
  const item = findItem(editingId);
  if (!item) return;
  if (!confirm('Delete "' + item.name + '" from the Pantry forever?\n\n' +
               'This is the only thing in the app that really deletes something.')) return;
  update(() => { state.items = state.items.filter((i) => i.id !== editingId); });
  dialog.close();
});

/* ---------------- go ---------------- */
render();
