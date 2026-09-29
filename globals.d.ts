// For the type checker only — the browser never loads this file.
// It describes names that one file creates and another uses, which the
// checker can't work out from the files on their own.

// Made by sync.js, used by app.js. Missing if sync.js failed to load,
// which is why app.js always asks `if (window.Cloud)` first.
declare var Cloud: {
  start(onRestore: (data: any) => void, getState: () => any): void;
  push(state: any): void;
  isOn(): boolean;
};

// Supabase's own code, loaded from the internet by index.html. Described
// loosely on purpose: describing it fully would mean installing Supabase's
// package just for the checker.
declare var supabase: any;
