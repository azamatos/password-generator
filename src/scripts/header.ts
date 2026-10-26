// The header persists across pages: Recent keeps its list, and the theme and site switcher are set up once. On each
// page change only the current tab and site are marked again.
import { clamp } from "@/lib/math";
import { find, findAll, mount } from "./dom";
import { clearRecent, onRecentChange, recentItems, type RecentItem } from "./recent";
import { onThemeChange, setThemeChoice, themeChoice, type ThemeChoice } from "./theme";

function ago(at: number): string {
  const minutes = Math.floor((Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}

// Enough to recognize a password without showing it to anyone looking over your shoulder.
const mask = (value: string) => value.slice(0, 3) + "•".repeat(clamp(value.length - 3, 4, 12));

function setupRecent(header: HTMLElement) {
  const open = find<HTMLButtonElement>(header, "[data-recent-open]");
  const count = find(header, "[data-recent-count]");
  const dialog = find<HTMLDialogElement>(header, "[data-recent-dialog]");
  const list = find<HTMLOListElement>(dialog, "[data-recent-list]");
  const empty = find(dialog, "[data-recent-empty]");
  const clear = find<HTMLButtonElement>(dialog, "[data-recent-clear]");
  const status = find(dialog, "[data-recent-status]");
  // Built here for each password, so the asterisk and the copy icon come from templates in the markup.
  const anyLogo = find<HTMLTemplateElement>(dialog, "[data-any-logo]");
  const copyIcon = find<HTMLTemplateElement>(dialog, "[data-copy-icon]");

  const tile = (id: string) => {
    const tile = document.createElement("span");
    tile.className = "tile";
    if (id === "any") tile.append(anyLogo.content.cloneNode(true));
    else {
      const img = document.createElement("img");
      img.src = `/icons/${id}.svg`;
      img.alt = "";
      tile.append(img);
    }
    return tile;
  };

  const row = (item: RecentItem) => {
    const li = document.createElement("li");
    const text = document.createElement("div");
    text.className = "text";
    const value = document.createElement("code");
    value.textContent = mask(item.value);
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${item.site} · ${ago(item.at)}`;
    text.append(value, meta);
    const button = document.createElement("button");
    button.type = "button";
    const label = document.createElement("span");
    label.textContent = "Copy";
    button.append(copyIcon.content.cloneNode(true), label);
    button.setAttribute("aria-label", `Copy the ${item.site} password from ${ago(item.at)}`);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(item.value);
        label.textContent = "Copied";
        status.textContent = "Copied to the clipboard.";
      } catch {
        status.textContent = "Couldn't copy.";
      }
      setTimeout(() => (label.textContent = "Copy"), 2000);
    });
    li.append(tile(item.id), text, button);
    return li;
  };

  const render = () => {
    const items = recentItems();
    count.hidden = items.length === 0;
    count.textContent = String(items.length);
    open.setAttribute("aria-label", items.length ? `Recent, ${items.length} copied` : "Recent");
    empty.hidden = items.length > 0;
    clear.hidden = items.length === 0;
    list.replaceChildren(...items.map(row));
  };

  open.addEventListener("click", () => {
    render();
    dialog.showModal();
  });
  clear.addEventListener("click", () => {
    clearRecent();
    status.textContent = "Recent passwords cleared.";
  });
  onRecentChange(render);
  render();
}

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function setupTheme(header: HTMLElement) {
  const radios = findAll<HTMLInputElement>(header, 'input[name="theme"]');
  const step = find<HTMLButtonElement>(header, "[data-theme-step]");
  const show = (choice: ThemeChoice) => {
    for (const radio of radios) radio.checked = radio.value === choice;
    const i = THEMES.findIndex((t) => t.value === choice);
    step.dataset.choice = choice;
    step.setAttribute("aria-label", `Theme: ${THEMES[i].label}. Switch to ${THEMES[(i + 1) % 3].label}`);
  };
  for (const radio of radios) radio.addEventListener("change", () => setThemeChoice(radio.value as ThemeChoice));
  step.addEventListener("click", () => {
    const i = THEMES.findIndex((t) => t.value === themeChoice());
    setThemeChoice(THEMES[(i + 1) % 3].value);
  });
  onThemeChange(show);
  show(themeChoice());
}

function setupSites(header: HTMLElement) {
  const dialog = find<HTMLDialogElement>(header, "[data-sites-dialog]");
  const search = find<HTMLInputElement>(dialog, "[data-sites-search]");
  const items = findAll<HTMLLIElement>(dialog, "[data-sites-list] li[data-name]");
  const none = find(dialog, "[data-sites-none]");
  const query = find(dialog, "[data-sites-query]");

  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const item of items) {
      item.hidden = !item.dataset.name!.includes(q);
      if (!item.hidden) shown++;
    }
    none.hidden = shown > 0;
    query.textContent = search.value.trim();
  };

  const open = () => {
    search.value = "";
    filter();
    if (!dialog.open) dialog.showModal();
    search.focus();
  };

  search.addEventListener("input", filter);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // Closing gives focus back to the button that opened the switcher, where Firefox would take this Enter as a
      // click and open it again.
      e.preventDefault();
      items
        .find((i) => !i.hidden)
        ?.querySelector("a")
        ?.click();
    } else if (e.key === "Escape" && search.value) {
      // The first Escape clears the search, the second closes.
      e.preventDefault();
      search.value = "";
      filter();
    }
  });
  // "Change site" is part of the page and swapped with it, so its clicks are caught here. It's a link to the list of
  // sites for when there's no JavaScript; caught before the client router follows it.
  document.addEventListener(
    "click",
    (e) => {
      if (!(e.target as Element).closest?.("[data-sites-open]")) return;
      e.preventDefault();
      open();
    },
    { capture: true },
  );
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    }
  });
}

// ⌘K on Apple devices, Ctrl K elsewhere, wherever the page shows the shortcut.
const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";
const showShortcuts = () => document.querySelectorAll("[data-shortcut]").forEach((k) => (k.textContent = shortcut));

/** Marks the current site in the switcher, and the current tab: Generator on a site's page, Health on /health/. */
function markCurrent(header: HTMLElement) {
  const path = location.pathname.replace(/\/?$/, "/");
  const mark = (link: HTMLAnchorElement, current: boolean) => {
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  };
  const sites = findAll<HTMLAnchorElement>(header, "[data-sites-list] a");
  for (const link of sites) mark(link, link.getAttribute("href") === path);
  const [generator, health] = findAll<HTMLAnchorElement>(header, "[data-tabs] a");
  mark(
    generator,
    sites.some((link) => link.hasAttribute("aria-current")),
  );
  mark(health, path === "/health/");
}

mount("[data-header]", (header) => {
  setupRecent(header);
  setupTheme(header);
  setupSites(header);
  markCurrent(header);
  showShortcuts();

  const dialogs = findAll<HTMLDialogElement>(header, "[data-dialog]");
  for (const dialog of dialogs) {
    dialog.querySelector("[data-dialog-close]")?.addEventListener("click", () => dialog.close());
    // A click on the backdrop lands on the dialog element itself.
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
  // Closed before the page changes, so the header moves into the new page without an open dialog.
  document.addEventListener("astro:before-preparation", () => dialogs.forEach((d) => d.close()));
  document.addEventListener("astro:after-swap", () => {
    markCurrent(header);
    showShortcuts();
  });
});
