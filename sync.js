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
  let getState  = null;  // app.js hands us this, to read the live list
  let pendingEmail = ''; // the address we sent a code to
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
      if (error) return;

      // Nothing up there yet — this is the first sign-in, so send this
      // phone's list up rather than leaving the backup empty.
      if (!data) {
        if (getState) push(getState());
        return;
      }

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

  // The signed-out half has two steps: ask for the email, then ask for
  // the code that lands in it.
  function showStep(which) {
    $('cloud-step-email').classList.toggle('hidden', which !== 'email');
    $('cloud-step-code').classList.toggle('hidden', which !== 'code');
    if (which === 'code') $('cloud-code').focus();
  }

  function paintDialog() {
    const signedIn = !!user;
    $('cloud-out').classList.toggle('hidden', signedIn);
    $('cloud-in').classList.toggle('hidden', !signedIn);
    if (!signedIn && !pendingEmail) showStep('email');
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

    // Step 1 — ask Supabase to email a six-digit code.
    //
    // Deliberately NO emailRedirectTo here. A link would open in Safari,
    // and on iOS a Home Screen app has its own separate storage, so the
    // session would land in the wrong place and this app would still look
    // signed out. A code you type stays in whichever app you typed it in.
    $('cloud-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('cloud-email').value.trim();
      if (!email) return;
      const note = $('cloud-note');
      note.textContent = 'Sending…';
      try {
        const { error } = await sb.auth.signInWithOtp({ email });
        if (error) {
          note.textContent = 'Could not send: ' + error.message;
          return;
        }
        pendingEmail = email;
        note.textContent = '';
        $('cloud-sent-to').textContent = 'Code sent to ' + email;
        showStep('code');
      } catch (err) {
        note.textContent = 'Could not send. Are you online?';
      }
    });

    // Step 2 — check the code. This is what actually signs you in.
    $('cloud-code-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = $('cloud-code').value.replace(/\D/g, '');
      const note = $('cloud-code-note');
      if (token.length < 6) { note.textContent = 'That code looks too short.'; return; }
      note.textContent = 'Checking…';
      try {
        const { error } = await sb.auth.verifyOtp({
          email: pendingEmail, token, type: 'email'
        });
        if (error) {
          note.textContent = 'That code did not work: ' + error.message;
          return;
        }
        note.textContent = '';
        pendingEmail = '';
        $('cloud-code').value = '';
        // onAuthStateChange takes it from here: paints, pulls, backs up.
      } catch (err) {
        note.textContent = 'Could not check the code. Are you online?';
      }
    });

    $('cloud-back').addEventListener('click', () => {
      pendingEmail = '';
      $('cloud-code').value = '';
      $('cloud-code-note').textContent = '';
      showStep('email');
    });

    $('cloud-signout').addEventListener('click', async () => {
      await sb.auth.signOut();
      dlg.close();
    });
  }

  /* ---------------- startup ---------------- */

  async function start(restoreFn, stateFn) {
    onRestore = restoreFn;
    getState  = stateFn;
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
