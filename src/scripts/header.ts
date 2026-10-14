// The header persists across pages: the tab pill slides to the current page, and Recent keeps its list.
import { clamp } from "@/lib/math";
import { find, findAll, mount } from "./dom";
import { clearRecent, onRecentChange, recentItems, type RecentItem } from "./recent";

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

  const row = (item: RecentItem) => {
    const li = document.createElement("li");
    const text = document.createElement("div");
    const value = document.createElement("code");
    value.textContent = mask(item.value);
    const meta = document.createElement("span");
    meta.textContent = `${item.site} · ${ago(item.at)}`;
    text.append(value, meta);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "small-btn";
    button.textContent = "Copy";
    button.setAttribute("aria-label", `Copy the ${item.site} password from ${ago(item.at)}`);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(item.value);
        button.textContent = "Copied";
        status.textContent = "Copied to the clipboard.";
      } catch {
        status.textContent = "Couldn't copy.";
      }
      setTimeout(() => (button.textContent = "Copy"), 2000);
    });
    li.append(text, button);
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
  find(dialog, "[data-recent-close]").addEventListener("click", () => dialog.close());
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  clear.addEventListener("click", () => {
    clearRecent();
    status.textContent = "Recent passwords cleared.";
  });
  onRecentChange(render);
  render();
}

// Slides the dark pill under the current tab, like the original header.
function movePill(header: HTMLElement, animate: boolean) {
  const nav = find(header, "[data-tabs]");
  const pill = find(header, "[data-pill]");
  const onHealth = location.pathname.startsWith("/health");
  const links = findAll<HTMLAnchorElement>(nav, "a");
  for (const link of links) {
    const current = (link.getAttribute("href") === "/health/") === onHealth;
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  const active = links.find((l) => l.hasAttribute("aria-current"));
  if (!active) return;
  if (!animate) pill.style.transition = "none";
  pill.style.width = `${active.offsetWidth}px`;
  pill.style.transform = `translateX(${active.offsetLeft - 4}px)`;
  nav.classList.add("has-pill");
  if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => (pill.style.transition = "")));
}

mount("[data-header]", (header) => {
  setupRecent(header);
  movePill(header, false);
  window.addEventListener("resize", () => movePill(header, false));
  document.addEventListener("astro:page-load", () => movePill(header, true));
});
