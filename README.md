# pass

**Passwords that pass a site's real password rules.** Live at [pass.azamatos.com](https://pass.azamatos.com).

Pick a site, and the generator makes a password its sign-up form accepts: the right length, the character types it
requires, only the symbols it allows, no more repeats than it permits. There are passphrases for things you type by
hand, and a check at [/health](https://pass.azamatos.com/health/) for how long a password would take to guess and
whether it has leaked.

Sites: Instagram, Google, Apple, Microsoft, GitHub, Amazon, X (Twitter), LinkedIn, Spotify, TikTok, PayPal, Facebook,
Netflix, Shopify, Steam and Twitch, plus "Any site".

## How it works

Everything runs in the browser. There is no backend and no account, and nothing is stored: the list of copied
passwords lives in the open tab's memory and is gone on reload.

- **Random the right way.** Characters come from `crypto.getRandomValues` with rejection sampling, so no character
  is likelier than another. Whole passwords are drawn and redrawn until they meet the rules, rather than "one of each
  required type, then shuffle", which makes some passwords likelier. The strength shown is the exact entropy of what
  the generator can produce, counted with inclusion–exclusion.
- **Rules with sources.** Each site's rules in `src/data/platforms.json` come with the pages they were read from, the
  month they were checked and notes where sources disagree. A schema rejects typos and impossible rules, tests
  generate 1,000 passwords per site and check each against its rules, and CI fails when a site's rules are more
  than six months old.
- **The leak check sends 5 characters.** /health asks [Have I Been Pwned](https://haveibeenpwned.com/Passwords) with
  k-anonymity: only the first 5 hex characters of the password's SHA-1 hash leave the browser, with padding so the
  answer's size gives nothing away. It can be turned off, and then nothing is sent. The strength estimate is
  [zxcvbn-ts](https://zxcvbn-ts.github.io/zxcvbn/), in a Web Worker.
- **A strict Content Security Policy** (`public/_headers`). Scripts come only from this site and Cloudflare's
  analytics beacon, and pages may connect only to this site, Have I Been Pwned and the analytics. The build fails if
  a page has an inline script the policy would block.
- **No UI framework.** Astro renders static HTML, and plain TypeScript in `src/scripts` makes it interactive. The
  rules logic in `src/lib` is framework-free and unit-tested.

## Measured

| What                                                   | Result                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| JavaScript on a site's page (gzip, budget 14 kB)       | 13.1 kB; the word list (24.8 kB) loads on the first passphrase                              |
| JavaScript on /health (gzip, budget 10 kB)             | 9.3 kB; the strength worker (838 kB) loads on the first check                               |
| CSS (gzip, inlined)                                    | 5.6 kB                                                                                      |
| Lighthouse on a phone (local)                          | performance 99–100; accessibility, best practices and SEO 100                               |
| Layout shift while a page loads, at 360 px and 1280 px | 0                                                                                           |
| Tests                                                  | 87 unit tests; 41 Playwright tests in Chromium, Firefox and WebKit, with axe in both themes |

## Run it locally

Needs Node 22.12+ and pnpm 10.

| Command                                          | What it does                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev`                                       | Dev server on http://localhost:4001                                                   |
| `pnpm check` · `pnpm lint` · `pnpm format:check` | Types, ESLint, Prettier                                                               |
| `pnpm test`                                      | Vitest: the rules logic and the site data                                             |
| `pnpm e2e`                                       | Playwright with axe in Chromium, Firefox and WebKit, under the real CSP, on port 4011 |
| `pnpm build` · `pnpm size`                       | Static build to `dist/`, with a share image per page; size budgets                    |

CI (`.github/workflows/ci.yml`) runs all of these, plus Lighthouse CI, on every push and pull request and once a
month.

## Adding a site

Add its rules to `src/data/platforms.json` with at least one source and the month you checked them, and its logo to
`public/icons/<id>.svg`. The page, the sidebar entry and the share image are made from that; `pnpm test` checks the
rest. `CLAUDE.md` has the details.

MIT licence. Built by [Azamat Jorayev](https://azamatos.com).
