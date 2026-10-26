export interface RecentItem {
  value: string;
  /** The site's name, and its id for the logo. */
  site: string;
  id: string;
  at: number;
}

const MAX_ITEMS = 10;

// Kept in this module only: never written to storage, gone when the tab reloads or closes.
let items: RecentItem[] = [];
const listeners = new Set<() => void>();

export function addRecent(item: RecentItem) {
  items = [item, ...items.filter((i) => i.value !== item.value)].slice(0, MAX_ITEMS);
  listeners.forEach((fn) => fn());
}

export function clearRecent() {
  items = [];
  listeners.forEach((fn) => fn());
}

export function recentItems(): readonly RecentItem[] {
  return items;
}

export function onRecentChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
