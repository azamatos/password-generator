/**
 * Runs `setup` once for the element matching `selector`: right away if it's on the page, and again
 * whenever a client-router navigation brings in a new one. Elements kept across pages with
 * transition:persist (header, sidebar) keep their marker, so they are set up only once.
 */
export function mount(selector: string, setup: (root: HTMLElement) => void): void {
  const run = () => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root || "mounted" in root.dataset) return;
    root.dataset.mounted = "";
    setup(root);
  };
  run();
  document.addEventListener("astro:page-load", run);
}

/** The element matching `selector` inside `root`. Throws when the markup and the script disagree. */
export function find<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}

export function findAll<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)];
}
