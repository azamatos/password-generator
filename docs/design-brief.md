# Design brief: pass

Redesign **pass**, a free password generator at https://pass.azamatos.com, so it reads as part of the azamatos.com
family. Phone first (360 px), then desktop up to 1280 px. The site is static, built in Astro with plain TypeScript and
hand-written CSS: no component library and no Tailwind. Your screens will be rebuilt by hand from their source, so a
small set of parts reused everywhere works better than many one-offs.

## What it does

- **Passwords that pass a site's real rules.** 16 sites plus "Any site", one page each (`/github/`, `/paypal/`, …).
  Most visitors land on a site's page from a search like "PayPal password generator".
- **Passphrases** from the EFF word list, for things people type by hand.
- **`/health`:** how long a password would take to guess, and whether it has leaked (Have I Been Pwned; only the
  first 5 characters of its SHA-1 hash leave the browser).
- Everything runs in the browser. Nothing is stored, apart from a list of copied passwords that lives in the open tab
  only.

## Who it's for

Someone signing up or changing a password on a particular site, often on a phone, often arriving from search. Their
questions, in this order:

1. Will the site accept this password?
2. How do I copy it?
3. Is it strong enough?
4. Can I trust this page? Is anything sent, and where do the rules come from?

## What's wrong today

- **It doesn't look like the family.** The family sites (azamatos.com, rebuffer.azamatos.com, Visaproof) are dark
  first and flat: hairline borders, Geist and Space Mono, one accent per site. pass is a cream page with shadows, a
  condensed display font (Boldonse) for the site name, Inter Tight and JetBrains Mono, and a banner tinted with each
  site's brand colour.
- **Its dark theme only follows the device.** There's no switch, and its warm brown doesn't match the family's dark.
- **The trust story is invisible.** Every site's rules come with sources, a "checked" month and sometimes a note, but
  the page never shows them.
- **Three light-theme contrast failures:** the "Leaked" chip (3.9:1), the 404 number (2.7:1) and the switch's off
  track (1.3:1).

## Situations to design

Each one needs its states. The data is real.

**A site's page (the generator)**

- **Rules, from none to strict.** Any site has no rules. GitHub needs a lowercase letter and a number. PayPal needs
  8–20 characters, a letter, a number or symbol, only `!@#$%^&*()`, and no character 4 times in a row. TikTok
  allows 8–20 characters with all three classes and only `!#$%&@`. Google allows spaces.
- **Character classes** (a–z, A–Z, 0–9, symbols) have four states each: on, off, **required** by the site (on and
  locked) and **not allowed** by it (off and locked). Plus "avoid look-alikes" (0 O 1 l I).
- **Length:** a slider clamped to the site's limits, with a "recommended" reset.
- **Strength:** five levels (Very weak, Weak, Fair, Strong, Very strong), shown with bars, the level and details such
  as "16 characters · 103 bits".
- **"Meets GitHub's rules":** always true, since every password is drawn to pass. It isn't shown on Any site.
- **Copy:** copied; and the browser refused clipboard access.
- **The rules themselves:** what's shown today ("At least 8 characters", "A lowercase letter", "A number"), plus the
  missing sources, checked date and notes. For example, GitHub: "15+ characters may be anything; shorter ones need a
  lowercase letter and a number", from GitHub Docs, checked Oct 2026. Spotify: "#" left out because its sign-up form
  has had trouble with it.
- **Passphrase mode:**
  - 4–10 words, separated by `-` `.` `_`, a space, or nothing (the site's rules decide which are allowed).
  - Options to capitalise and to add a number.
  - The first switch loads the word list (25 KB).
  - Sometimes it can't work: TikTok's 20-character limit is too short for 4 words. The page then says why and
    offers "Use a password".
- **Before the script runs:** the password area holds the space of a password of the right length, so nothing moves
  when it fills in.
- **Choosing a site:** 17 entries with search (⌘K), the current one marked.
- **Recent:** the passwords copied in this tab, masked. An empty state, a filled list, and "Clear all". It says
  plainly that they disappear when the tab closes.

**`/health`**

- **Empty.** First use loads the word lists (about 840 KB, once).
- **A result:**
  - The level, with bars.
  - Two crack times: guessed online at 10 tries a second, and from a leaked database at 10,000 a second.
  - A warning and suggestions.
  - Show or hide the password, Clear, and "Generate a stronger one".
- **Leak check:** on by default, with a switch to turn it off. Its results are leaked (with a count), not found,
  check failed (offline, or Have I Been Pwned is down) and turned off. People type real passwords here, so the page
  must make clear what is sent.

**Also:** the 404 page, and the share image (1200×630, one per site, built from the same data).

## Limits

- **Both themes.** Dark is the main design; light comes second. Add a System / Dark / Light switch like the family's
  other sites. Text contrast at least 4.5:1; controls, the switch track and the strength bars at least 3:1.
- **Keyboard first.** Everything is reachable with Tab and shows its focus. Nothing appears only on hover.
- **Phones.** No sideways scroll at 360 px. The password and Copy are visible without scrolling.
- **No layout shift** when the script takes over or the fonts load.
- **Budgets.**
  - About 13 KB of JavaScript (gzipped) on a site's page.
  - The CSS is inlined, about 5.5 KB gzipped today.
  - No new libraries, and Lighthouse 100 on a phone.
  - New colours, shadows, gradients and one-off sizes all cost bytes: say when a design needs them.
- **The password font** must tell 0 from O and 1 from l and I. If Space Mono doesn't, say so and propose another.
- **Words:** plain and short, with numbers instead of adjectives. Never "unhackable" or "100% secure".

## Brand

- **Wordmark:** the family's shell prompt in Space Mono, `➜ ~ pass.azamatos▊`. The cursor blinks four times, then
  stays solid, and doesn't blink with reduced motion. The favicon keeps the prompt arrow.
- **Family tokens, dark:**
  - Background `#010101`
  - Text `#fff`, secondary `#a6a6a6`, muted `rgba(255,255,255,.5)`
  - Border `rgba(255,255,255,.18)`, hover `.35`
  - Surface `rgba(255,255,255,.02)`, hover `.06`
  - Type: Geist 400 and 500, and Space Mono 400 for the wordmark and small data.
- **The family's light theme** (Visaproof's):
  - Background `#f7f7f5`
  - Text `#0b0b0b`, secondary `#4d4d4d`, muted `#6b6b6b`
  - Border `rgba(0,0,0,.14)`, strong `.32`
  - Surface `#fff`, hover `#f0f0ee`
- **Accent: coral.** Today it is `#ff6b4d`, with `#2a0e07` for text on it. The portfolio and Rebuffer use mint and
  Visaproof uses blue. Propose a coral that works in both themes.
- **Open questions for you to propose:**
  - The strength tones (weak, fair, good). Today "weak" is a red-orange that sits close to the coral accent.
  - Each site's brand colour. Today the 16 sites each have a muted brand colour on the banner, the Copy button and
    the slider. Keep it, shrink it to the logo, or drop it?
  - The site list. It shows 10 of 17 today, and "+7 more" needs JavaScript. Is a sidebar still the right way to
    switch sites, especially on a phone?

## What to hand back

- **Screens,** phone and desktop, in both themes:
  - The generator on Any site, GitHub and PayPal.
  - Passphrase mode, both normal and the TikTok "can't" case.
  - Recent open.
  - `/health`: empty, loading, strong and not leaked, weak and leaked, leak check failed.
  - The 404 page.
  - One share image.
- **Components:** the header (wordmark, navigation, theme switch, Recent), buttons, the character-class toggle in its
  four states, the slider, the strength meter, the rules with their sources, and the site switcher.
- **Tokens:** the accent and the strength tones in both themes, radii, spacing and the type scale.

## The sites

Checked in October 2026. "Any" means any characters are allowed.

| Site        | Length | Needs                                       | Symbols        |
| ----------- | ------ | ------------------------------------------- | -------------- |
| Any site    | 8+     | — (spaces allowed)                          | any            |
| Instagram   | 6+     | —                                           | any            |
| Google      | 8+     | — (spaces allowed)                          | any            |
| Apple       | 8–63   | lowercase, uppercase, number; no 3 in a row | any            |
| Microsoft   | 8–127  | 2 of: lowercase, uppercase, number, symbol  | any            |
| GitHub      | 8+     | lowercase, number                           | any            |
| Amazon      | 6+     | 3 of: lowercase, uppercase, number, symbol  | any            |
| X (Twitter) | 8+     | —                                           | any            |
| LinkedIn    | 8–200  | —                                           | any            |
| Spotify     | 10–100 | a letter; a number or symbol                | any except `#` |
| TikTok      | 8–20   | a letter, a number, a symbol                | `!#$%&@`       |
| PayPal      | 8–20   | a letter; a number or symbol; no 4 in a row | `!@#$%^&*()`   |
| Facebook    | 6+     | —                                           | any            |
| Netflix     | 6–60   | —                                           | any except `~` |
| Shopify     | 8+     | — (spaces allowed)                          | any            |
| Steam       | 8–64   | lowercase, uppercase, number                | `~!@#$%^&*`    |
| Twitch      | 8–71   | —                                           | any            |
