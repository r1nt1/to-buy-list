// ESLint: looks for risky or sloppy patterns in the app's JavaScript.
import js from '@eslint/js';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    files: ['aisles.js', 'sync.js', 'app.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script' },
    rules: {
      // The three files share names with each other and with the browser.
      // TypeScript's checker already catches names that don't exist, and
      // knows every browser name, so ESLint doesn't need to guess too.
      'no-undef': 'off',
    },
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: { sourceType: 'module' },
  },
];
