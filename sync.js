/* ===================================================================
   sync.js — cloud backup for To buy list.

   How this fits together:
     • localStorage stays the live copy. The app reads and writes it
       exactly as it always has, so it still works with no signal.
     • Supabase gets a copy shortly after every change.
     • On open, whichever copy has the newer timestamp wins.

   If this file fails to load, if you are signed out, or if you are
   offline, the app carries on as a purely local app. Nothing here is
   allowed to break the list.

   The key below is a PUBLISHABLE key. It is designed to sit in public
   code — it can do nothing on its own. What actually protects the data
   is Row Level Security in the database, which only lets a signed-in
   person touch their own row. The sb_secret_... key is the dangerous
   one, and it is not here and must never be.
   =================================================================== */

const SB_URL = 'https://wuoktzfjknuvmegjzusn.supabase.co';
const SB_KEY = 'sb_publishable_UXfu1wEGZJ_rxX3v7bVukg_tR9j2cy6';

const STAMP_KEY   = 'groceries.v2.savedAt';   // when this device last changed something
const REPLACED_KEY = 'groceries.v2.replaced'; // safety net, see adopt() in app.js

window.Cloud = (function () {
  let sb = null;         // the supabase client, once it exists
  let user = null;       // the signed-in user, or null
  let pending = null;    // the newest state waiting to be sent
  let timer = null;      // debounce handle
  let onRestore = null;  // app.js hands us this, to hand data back
  let status = 'off';    // off | ready | saving | saved | error

  const ready = () => !!(sb && user);
  const $ = (id) => document.getElementById(id);

  /* ---------------- talking to the database ---------------- */

  // Pull the cloud copy and hand it over only if it is newer than ours.
  async function pull() {
    if (!ready()) return;
    try {
      const { data, error } = await sb
        .from('lists')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) return;

      const mine   = localStorage.getItem(STAMP_KEY);
      const mineMs = mine ? Date.parse(mine) : 0;
      const theirs = Date.parse(data.updated_at);

      // Date.parse handles the two different timestamp spellings —
      // Postgres writes "+00:00", JavaScript writes "Z".
      if (theirs > mineMs && onRestore) {
        onRestore(data.data);
        localStorage.setItem(STAMP_KEY, new Date(theirs).toISOString());
      }
    } catch (err) {
      console.warn('Could not read the cloud copy.', err);
    }
  }

  // Called on every save. Stamps locally always; sends only if signed in.
  function push(state) {
    const stamp = new Date().toISOString();
    localStorage.setItem(STAMP_KEY, stamp);
    pending = { data: state, updated_at: stamp };
    if (!ready()) return;
    setStatus('saving');
    clearTimeout(timer);
    timer = setTimeout(flush, 1200);   // wait for typing to settle
  }

  async function flush() {
    if (!ready() || !pending) return;
    const row = { user_id: user.id, data: pending.data, updated_at: pending.updated_at };
    try {
      const { error } = await sb.from('lists').upsert(row);
      setStatus(error ? 'error' : 'saved');
      if (error) console.warn('Could not back up.', error);
    } catch (err) {
      setStatus('error');
      console.warn('Could not back up.', err);   // offline, most likely
    }
  }

  /* ---------------- the button and the dialog ---------------- */

  function setStatus(next) {
    status = next;
    const btn = $('cloud-btn');
    if (!btn) return;
    const label = {
      off:    'Backup off',
      ready:  'Backed up',
      saving: 'Saving…',
      saved:  'Backed up',
      error:  'Backup failed'
    }[next];
    btn.dataset.state = next;
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function paintDialog() {
    const signedIn = !!user;
    $('cloud-out').classList.toggle('hidden', signedIn);
    $('cloud-in').classList.toggle('hidden', !signedIn);
    if (signedIn) {
      $('cloud-who').textContent = user.email || 'signed in';
      const at = localStorage.getItem(STAMP_KEY);
      $('cloud-when').textContent = at
        ? 'Last change saved ' + new Date(at).toLocaleString()
        : 'Nothing saved yet.';
    }
  }

  function wire() {
    const btn = $('cloud-btn');
    const dlg = $('cloud-dialog');
    if (!btn || !dlg) return;

    btn.addEventListener('click', () => { paintDialog(); dlg.showModal(); });
    $('cloud-close').addEventListener('click', () => dlg.close());

    $('cloud-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('cloud-email').value.trim();
      if (!email) return;
      const note = $('cloud-note');
      note.textContent = 'Sending…';
      try {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.href }
        });
        note.textContent = error
          ? 'Could not send: ' + error.message
          : 'Check your email and tap the link. You can close this.';
      } catch (err) {
        note.textContent = 'Could not send. Are you online?';
      }
    });

    $('cloud-signout').addEventListener('click', async () => {
      await sb.auth.signOut();
      dlg.close();
    });
  }

  /* ---------------- startup ---------------- */

  async function start(restoreFn) {
    onRestore = restoreFn;
    setStatus('off');

    // No library (offline, or the CDN is blocked) — stay a local app.
    if (!window.supabase) {
      console.warn('Supabase library did not load; running local-only.');
      return;
    }

    sb = window.supabase.createClient(SB_URL, SB_KEY);
    wire();

    try {
      const { data } = await sb.auth.getSession();
      user = data.session ? data.session.user : null;
    } catch (err) {
      console.warn('Could not check the session.', err);
    }

    setStatus(user ? 'ready' : 'off');
    if (user) pull();

    // Fires when the magic link lands, and when you sign out.
    sb.auth.onAuthStateChange((_event, session) => {
      user = session ? session.user : null;
      setStatus(user ? 'ready' : 'off');
      paintDialog();
      if (user) pull();
    });
  }

  return { start, push, isOn: ready };
})();
