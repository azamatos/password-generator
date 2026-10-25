// Switching pages without waiting for the network. Every page is static and changes only with a deploy, so each one is
// downloaded once per tab and kept in memory, and the client router takes it from there. Astro's prefetch couldn't do
// this: Cloudflare serves HTML with max-age=0 and no ETag, so the router downloaded the page again on every click.
// A tab left open across a deploy keeps the pages it has until it's reloaded, as it keeps Recent.

const pages = new Map<string, Promise<string | null>>();

/** A page of this site, from memory or downloaded once. Null for anything else, or when the download failed. */
function load(href: string): Promise<string | null> {
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return Promise.resolve(null);
  const path = url.pathname + url.search;
  let page = pages.get(path);
  if (!page) {
    page = download(path);
    pages.set(path, page);
    // A failed download is tried again next time.
    void page.then((html) => html === null && pages.delete(path));
  }
  return page;
}

async function download(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    // Errors, redirects and anything that isn't a page are left to the router.
    const html = response.headers.get("content-type")?.startsWith("text/html");
    if (!response.ok || response.redirected || !html) return null;
    const text = await response.text();
    preloadScripts(text);
    return text;
  } catch {
    return null;
  }
}

// The page's scripts load now too, so it doesn't wait for them once it opens.
function preloadScripts(html: string) {
  for (const [, src] of html.matchAll(/<script type="module" src="([^"]+)"/g)) {
    if (document.querySelector(`script[src="${src}"], link[href="${src}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = src;
    document.head.append(link);
  }
}

document.addEventListener("astro:before-preparation", (event) => {
  if (event.formData) return;
  const fromNetwork = event.loader;
  event.loader = async () => {
    const html = await load(event.to.href);
    if (html === null) return fromNetwork();
    const page = new DOMParser().parseFromString(html, "text/html");
    // As in Astro's own loader: the parser turns what's inside <noscript> into elements.
    page.querySelectorAll("noscript").forEach((el) => el.remove());
    event.newDocument = page;
  };
});

// Both tabs are one click away from every page, and this page is one Back away. Other links load when they're pointed
// at, focused or touched, which on a slow connection is usually enough of a head start.
const loadTabs = () => [location.pathname, "/", "/health/"].forEach((path) => void load(path));
addEventListener("load", () => setTimeout(loadTabs), { once: true });
for (const type of ["pointerover", "focusin", "touchstart"]) {
  document.addEventListener(
    type,
    (event) => {
      const link = (event.target as Element).closest?.<HTMLAnchorElement>("a[href]");
      if (link) void load(link.href);
    },
    { passive: true },
  );
}
