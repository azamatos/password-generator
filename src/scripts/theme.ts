// System, Light or Dark. The choice is kept in localStorage, and <html data-theme> always holds the theme in use, so
// the CSS needs one set of dark tokens. The script in Base.astro sets it before the first paint; this module keeps it
// set: after the client router swaps in a page (which drops the attribute), when the system's setting changes while
// the choice is System, and when the choice changes here or in another tab.

export type ThemeChoice = "system" | "light" | "dark";

/** Also in Base.astro's script; change both together. */
const KEY = "pass-theme";
/** The page's background, for the browser's own toolbar. */
const GROUND = { light: "#faf5ec", dark: "#15130f" };

const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function stored(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    // Storage can be blocked (private windows, site data turned off): the system's setting still works.
    return "system";
  }
}

let choice = stored();
const listeners = new Set<(choice: ThemeChoice) => void>();

function apply() {
  const theme = choice === "system" ? (darkQuery.matches ? "dark" : "light") : choice;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", GROUND[theme]);
}

export const themeChoice = () => choice;

export function setThemeChoice(next: ThemeChoice) {
  choice = next;
  try {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Not kept for the next visit, but it applies in this tab.
  }
  apply();
  listeners.forEach((fn) => fn(choice));
}

export function onThemeChange(fn: (choice: ThemeChoice) => void) {
  listeners.add(fn);
}

document.addEventListener("astro:after-swap", apply);
darkQuery.addEventListener("change", apply);
addEventListener("storage", (event) => {
  if (event.key !== KEY && event.key !== null) return;
  choice = stored();
  apply();
  listeners.forEach((fn) => fn(choice));
});
