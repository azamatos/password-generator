// eslint.config.js
// Flat config format (ESLint 9+). Covers three file types in one file:
//   .astro  — Astro components (frontmatter + template)
//   .ts     — Lit components and utility modules
//   .js     — any plain JS in the project

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import litPlugin from 'eslint-plugin-lit';
import litA11yPlugin from 'eslint-plugin-lit-a11y';

export default tseslint.config(

  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      '.astro/**',   // Astro's generated type files
      'node_modules/**',
    ],
  },

  // ── Base JS rules (all files) ───────────────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript rules (.ts files) ───────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Astro files (.astro) ───────────────────────────────────────────────────
  ...eslintPluginAstro.configs.recommended,

  // ── Lit files (.ts inside src/components/lit/) ─────────────────────────────
  {
    files: ['src/components/lit/**/*.ts'],

    plugins: {
      lit: litPlugin,
      'lit-a11y': litA11yPlugin,
    },

    rules: {
      // Lit-specific: catches the most common mistakes
      'lit/attribute-value-entities':       'error', // use &amp; not & in templates
      'lit/binding-positions':               'error', // bindings in wrong place
      'lit/no-duplicate-template-bindings': 'error', // same property bound twice
      'lit/no-invalid-escape-sequences':    'error', // broken escape in html``
      'lit/no-legacy-template-syntax':      'error', // old Polymer-style syntax
      'lit/no-private-properties':          'warn',  // binding to _private props
      'lit/no-useless-template-literals':   'warn',  // html`${staticString}`
      'lit/prefer-nothing':                 'warn',  // return nothing not html``

      // Accessibility: Lit components need a11y too
      'lit-a11y/alt-text':          'error',
      'lit-a11y/anchor-is-valid':   'error',
      'lit-a11y/click-events-have-key-events': 'warn',
      'lit-a11y/no-autofocus':      'warn',
    },
  },

  // ── TypeScript strictness tuning (all .ts files) ───────────────────────────
  {
    files: ['**/*.ts'],

    rules: {
      // These fire too much in Lit's property decorator patterns
      '@typescript-eslint/no-explicit-any':          'warn',  // not error
      '@typescript-eslint/no-non-null-assertion':    'warn',  // ! is common in Lit

      // Decorators assign values that TS thinks are unused
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',   // _unused params are fine
        varsIgnorePattern: '^_',
      }],

      // Lit's html`` and css`` tags confuse the return type checker
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Lit uses protected/private frequently, TS enforces access modifiers
      '@typescript-eslint/explicit-member-accessibility': ['warn', {
        accessibility: 'explicit',
        overrides: { constructors: 'no-public' },
      }],
    },
  },

  // ── Astro frontmatter TypeScript ────────────────────────────────────────────
  {
    files: ['**/*.astro'],

    rules: {
      // Astro's global types (Astro, ImageMetadata) confuse the undefined check
      'no-undef': 'off',

      // Frontmatter often has variables used only in the template
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

);