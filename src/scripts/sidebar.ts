// The platform list persists across pages: search, "+ N more", and which platform is current.
import { find, findAll, mount } from "./dom";

mount("[data-sidebar]", (side) => {
  let visible = Number(side.dataset.visible);
  const list = find<HTMLUListElement>(side, "[data-list]");
  const search = find<HTMLInputElement>(side, "[data-search]");
  const items = findAll<HTMLLIElement>(list, "li");
  const more = find<HTMLButtonElement>(side, "[data-more]");
  const none = find(side, "[data-none]");
  let expanded = list.classList.contains("expanded");

  const render = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((item, i) => {
      // While searching, every match shows; otherwise only the first ones until "more" is pressed.
      const show = q ? item.dataset.name!.includes(q) : expanded || i < visible;
      item.hidden = !show;
      if (show) shown++;
    });
    none.hidden = shown > 0;
    more.hidden = Boolean(q) || visible >= items.length;
    more.textContent = expanded ? "show less" : `+ ${items.length - visible} more`;
    more.setAttribute("aria-expanded", String(expanded));
    list.classList.toggle("expanded", expanded);
  };

  more.addEventListener("click", () => {
    expanded = !expanded;
    render();
    list.scrollTo({ top: expanded ? list.scrollHeight : 0, behavior: "smooth" });
  });
  search.addEventListener("input", render);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      items
        .find((i) => !i.hidden)
        ?.querySelector("a")
        ?.click();
    } else if (e.key === "Escape") {
      search.value = "";
      render();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      search.focus();
      search.select();
    }
  });

  // Only the current link changes from page to page.
  const markCurrent = () => {
    const path = location.pathname.replace(/\/?$/, "/");
    let index = -1;
    items.forEach((item, i) => {
      const link = find<HTMLAnchorElement>(item, "a");
      const current = link.getAttribute("href") === path;
      if (current) {
        link.setAttribute("aria-current", "page");
        index = i;
      } else link.removeAttribute("aria-current");
    });
    // Open the list when the current platform is one of the hidden ones.
    if (index >= visible && !expanded && !search.value) {
      expanded = true;
      render();
    }
    const link = items[index]?.querySelector("a");
    if (link && matchMedia("(max-width: 760px)").matches) link.scrollIntoView({ block: "nearest", inline: "center" });
    else if (link && expanded) link.scrollIntoView({ block: "nearest" });
  };

  // Show as many platforms as fit beside the right column; the rest go behind "+ N more".
  const desktop = matchMedia("(min-width: 761px)");
  const fit = () => {
    if (!desktop.matches) return;
    const row = items[0].offsetHeight + 2;
    const next = Math.max(3, Math.floor((list.clientHeight + 2) / row));
    if (next === visible) return;
    visible = next;
    render();
    markCurrent();
  };
  new ResizeObserver(fit).observe(list);

  render();
  fit();
  markCurrent();
  document.addEventListener("astro:page-load", markCurrent);
});
