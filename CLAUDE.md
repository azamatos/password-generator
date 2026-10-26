# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

pass.azamatos.com is a static site that generates passwords which pass a chosen site's real password rules. It also makes passphrases and has a strength and leak checker at `/health`. There is one SEO page per platform (`/github/`, `/paypal/`, …), and "Any site" lives at `/`. Everything runs in the browser; there is no backend.

It is deployed on Cloudflare Pages as the static `dist/` folder. Pages injects Cloudflare Web Analytics at build time, and `public/_redirects` sends old URLs (the old vault and per-platform health pages, and the dropped Reddit page) to current ones with 301s.

`public/_headers` sets a strict CSP: scripts come only from this site and Cloudflare's beacon, and pages may connect only to this site, Have I Been Pwned and Cloudflare's analytics. Astro is set never to inline scripts, and `src/integrations/csp-check.ts` fails the build when a page has an inline script whose hash isn't in `script-src`. The one hashed script is in `Base.astro`: it sets the theme and `data-keys` (⌘ or Ctrl, for the shortcuts CSS shows) before the first paint. When you change it, the build prints the new hash for `_headers`. A new external host needs a CSP change first.

The design is "Pass Warm" from the Claude Design project "Password generator" (https://claude.ai/design/p/019dfc24-6122-76b0-8e2e-43122101cdb7, file `Pass Warm.html`, built from `docs/design-brief.md`): a warm cream, each site's own colour on its banner and controls, Geist and Space Mono, and a warm dark theme.

## Commands

Requires Node >= 22.12 and pnpm 10.

```sh
pnpm dev                                  # dev server on :4001 (opens a browser)
pnpm build                                # static build to dist/, including OG PNGs and the sitemap
pnpm preview                              # serve dist/
pnpm test                                 # vitest, all src/**/*.test.ts
pnpm vitest run src/lib/password.test.ts  # one file
pnpm vitest run -t "PayPal"               # tests whose name matches
pnpm lint                                 # eslint (ts + astro)
pnpm check                                # astro check: types in .astro and .ts
pnpm format                               # prettier --write (printWidth 120)
pnpm format:check                         # prettier --check, as CI runs it
pnpm e2e                                  # Playwright + axe in Chromium, Firefox and WebKit (builds first)
pnpm exec playwright test health.spec.ts --project=chromium   # one file, one engine
pnpm size                                 # gzip budgets (scripts/size.mjs), after pnpm build
```

Before calling a change done, run `pnpm test && pnpm lint && pnpm check`, and `pnpm prettier --check .` on the files you touched. When pages, components or scripts change, also run `pnpm e2e` and `pnpm build && pnpm size`.

## Tests and CI

- **`tests/e2e/`** runs against the built site, served by `tests/e2e/server.mjs` with the headers from `public/_headers`, so every test also runs under the real CSP. With `pnpm e2e` locally, a server already on :4011 is reused and not rebuilt; stop it after changing code.
- The tests never reach Have I Been Pwned: `pwned()` in `tests/e2e/helpers.ts` answers the range API. `open()` waits for the page's script to set `data-mounted`, since the built markup looks ready before the script can react.
- `a11y.spec.ts` runs axe on every screen and state in both color schemes; add new states to its list. `keyboard.spec.ts` tabs through whole pages and fails when a focused element shows no change.
- **Budgets:** `scripts/size.mjs` counts what each page loads up front (its scripts and their static imports), the word list and the worker. Raising a limit needs a reason in the commit. Lighthouse thresholds are in `lighthouserc.json`.
- **CI** (`.github/workflows/ci.yml`) runs everything on pushes to `main`, on pull requests and on the 1st of each month. The monthly run exists for the test that fails when a site's rules are more than 6 months old.

## Architecture

**There is no UI framework.** Astro components render static HTML with scoped CSS, and interactivity is plain TypeScript. Lit was removed on 2026-10-14; ignore any older notes about `pw-*` components.

- **Components hold markup and styles; `src/scripts/` holds behavior.** An interactive component ends with `<script>import "@/scripts/<name>";</script>`. The script calls `mount("[data-<name>]", setup)` from `scripts/dom.ts`, which runs setup once per element, now and after client-router navigations.
- **Scripts find elements with `find(root, "[data-…]")`**, which throws if the markup and the script disagree. Keep the `data-*` hooks when editing markup.
- **Shared pieces live in `src/components/ui/`:** `Button` (brand or soft; `sm`; `icon` for a square icon button; a link when given `href`), `Icon` (the design's line icons), `Logo` (a site's logo, or the asterisk for Any site), `Switch` (a row with its label, a hint and the switch), `Meter` (bars, level and details; `scripts/meter.ts` fills it), `RangeField` (driven by `scripts/range.ts` `bindRange`) and `Dialog` (the switcher's centred panel and Recent's corner panel). Reuse them instead of restyling buttons, sliders or dialogs. A parent only adds layout around them, through `:global(.class)` on a class it passes in.

**Client router and persistence.** `Base.astro` includes `<ClientRouter />`, and `Header.astro` uses `transition:persist`:

- The header holds the tabs, Recent, the theme switch and the site switcher (⌘K, or "Change site" on a generator page). Its DOM and listeners survive navigation, so on each `astro:after-swap` it only marks the current tab and site. It closes its dialogs before a page changes.
- Page content (the generator, `/health`) is swapped on each navigation and set up again.
- JS module state also survives navigation:
  - `src/scripts/generator.ts` keeps the user's choices in `prefs`, so they carry over between platforms.
  - `src/scripts/recent.ts` keeps copied passwords in memory only. Never writing them to storage is deliberate, for privacy. This is also why the ClientRouter stays: a full page load would empty the Recent list.
- **Pages come from memory.** `src/scripts/pages.ts` downloads each page once per tab and hands it to the router in `astro:before-preparation`, so switching pages makes no request. Both tabs and the current page load once the first page has; other links load when pointed at, focused or touched, along with their scripts. Astro's prefetch is off (`prefetch: false`): Cloudflare serves HTML with `max-age=0` and no ETag, so the router downloaded every prefetched page again, which cost a round trip per click.

**Data flow for a platform page:**

1. `src/data/platforms.json` holds each site's `PasswordRules`, plus `sources`, a `checked` date and optional `notes` explaining a rule. `src/data/platforms.ts` loads it and validates it with a zod schema (from `astro/zod`). The schema runs at build and test time only, and turns `"symbols": { "except": "#" }` into the default symbol set minus those characters.
2. `src/pages/[platform]/index.astro` (`getStaticPaths`) renders `App.astro`.
3. `App.astro` renders the `Banner` (the site's colour, logo, name and rule tags), the `Generator` (the password card and the options card) with `Rules` and `Trust` beside it, and `OtherSites`, the list of every site as plain links. Each page passes its site's colour to `Base.astro`, which sets it on `<main>` with `brandStyle` (`lib/color.ts`): the banner uses the colour as it is, and buttons, sliders and switches use it shifted until it holds 3:1 on the card in each theme. A test checks both for every site.
4. `Generator.astro` server-renders the initial state with `plan()` and passes the rules to the script as `data-rules` JSON.
5. `src/scripts/generator.ts` runs `plan()`, then `generate()`, then `entropyBits()`, and updates the DOM imperatively.

The server render and the script both start from `DEFAULT_PASSWORD_OPTIONS` / `DEFAULT_PASSPHRASE_OPTIONS` (in `lib/password.ts` / `lib/passphrase.ts`), so nothing shifts when the script takes over. "Recommended" under the sliders sets the same values.

**Core logic in `src/lib/`.** It is framework-free and unit-tested, and the security properties live here:

- **`PasswordRules`** (`lib/password.ts`):
  - `required` is a list of any-of groups: `["lower","upper"]` means "a letter".
  - `minClasses` means "N of these classes".
  - `symbols`: `null` means the default set and `""` means no symbols.
  - `spaces` and `maxRepeat` are optional.
- **`plan(rules, options)`** reconciles the user's toggles with the rules. It returns pools, `locked` and `unavailable` classes, and a clamped length. The UI is driven entirely by the plan.
- **`generate()`** draws whole passwords uniformly and redraws until the plan is met. Don't change it to "one of each class, then shuffle": that biases the output. `entropyBits()` is exact (inclusion–exclusion with BigInt).
- **`random.ts` `randomInt`** uses `crypto.getRandomValues` with rejection sampling, so there is no modulo bias. Never use `Math.random`.
- **`passphrase.ts` `planPassphrase`** can return `unsupported` with a reason, e.g. when a 20-character limit is too short for 4 words. The EFF wordlist (`lib/wordlist/`) is a `?raw` dynamic import, loaded the first time Passphrase is chosen.
- **Strength:** `lib/strength.ts` turns exact bits (`meterForBits`) or zxcvbn's 0–4 score (`meterForScore`) into the meter's label, bars and tone. The generator, `/health` and the share images all use it.
- **Describing rules:** `lib/describe.ts` has every way rules become text: the one-line summary in the switcher and the list of sites, the banner's tags, the notes under the character tiles, share-image tags and `monthYear` for "Checked Oct 2026".
- **"Any site"** is `ANY` in `data/platforms.ts` (id, name, color, and `ANY_SITE` from `lib/password.ts` as its rules). `App.astro` treats it like any other site, and the generator gets an `anySite` flag.

**`/health`** (`src/pages/health.astro`, behavior in `src/scripts/health.ts`):

- zxcvbn-ts runs in a Web Worker (`src/scripts/zxcvbn.worker.ts`, about 1.7 MB) that is created on the first input.
- The leak check uses the Have I Been Pwned range API with k-anonymity and padding (`lib/hibp.ts`): only the first 5 hex characters of the SHA-1 hash are sent.

**Share images.** `src/pages/og/[slug].png.ts` renders one 1200×630 PNG per page at build time with satori and resvg, from `src/og/cards.ts`, using the same platform data, so images can't go stale.

- satori needs TTF or WOFF (not WOFF2), which is why `src/og/fonts/` duplicates the site fonts.
- The colours and fonts in `src/og/render.ts` are copied from `src/styles/global.css` and the site's fonts. Change both together.

**Styling.** Design tokens are CSS custom properties in `src/styles/global.css`, light first on a warm cream. `<html data-theme>` always holds the theme in use: the inline script in `Base.astro` sets it before the first paint, and `scripts/theme.ts` keeps it after client-router swaps, when the system's setting changes and when the System / Light / Dark switch is used (the choice is kept in `localStorage`). Without JavaScript there's no attribute and the system's setting decides, which is why the dark tokens appear twice. Fonts are Latin subsets of Geist (400, 500, 600) and Space Mono (400, 700), local WOFF2 loaded through Astro's fonts API (`astro.config.mjs`) as `--font-sans` and `--font-mono`. The import alias `@/` maps to `src/`.

## Adding or changing a platform

1. Edit `src/data/platforms.json`: rules, at least one source, `checked: "YYYY-MM"`. When sources disagree, use the strictest compatible rule and say why in `notes`. A typo or impossible rule fails `pnpm test` and `pnpm build` with the field named.
2. Add `public/icons/<id>.svg`, and a `color` whose white or dark text reads at 4.5:1 (a test checks it). A test fails without the logo.
3. Nothing else to wire up. `pnpm test` checks that 1,000 generated passwords pass the new rules, and that passphrases either pass or explain why not. The page, its entries in the switcher and the list of sites, and the share image are generated automatically.
4. When removing or renaming a platform, add a 301 to `public/_redirects`.

## Conventions

- Commits: `type: Sentence-case summary` (`feat`, `fix`, `perf`, `refactor`, `style`, `docs`, `chore`), with a body that explains why.
- Comments explain why, not what. User-facing copy is short and plain.
- Question every new dependency. The client JS budget is tiny (about 13 KB gzipped on the main page, plus the wordlist and zxcvbn when used).
