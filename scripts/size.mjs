// Checks the built site against its budgets, gzipped. A page's JavaScript is every script it loads up front: the
// <script src> tags and what they import, but not dynamic import() (the word list) or the worker, which load on use
// and have budgets of their own. The CSS is inlined into each page.
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url);
const read = (path) => {
  try {
    return readFileSync(new URL(path, dist), "utf8");
  } catch {
    throw new Error(`No dist/${path}: run \`pnpm build\` before \`pnpm size\`.`);
  }
};
const gzip = (text) => gzipSync(text, { level: 9 }).length;

/** The page's scripts and everything they import statically, as paths inside dist/. */
function scriptsOf(page) {
  const html = read(page);
  const queue = [...html.matchAll(/<script[^>]*\bsrc="\/(_astro\/[^"]+\.js)"/g)].map((m) => m[1]);
  const seen = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    // `import x from"./a.js"`, `import"./a.js"` and `export{x}from"./a.js"`; never `import("./a.js")`.
    for (const [, spec] of read(file).matchAll(/\b(?:import|export)\s*(?:[^"'();]*?\bfrom\s*)?["'](\.\/[^"']+)["']/g)) {
      queue.push(new URL(spec, new URL(file, "file:///")).pathname.slice(1));
    }
  }
  return [...seen];
}

const js = (page) => scriptsOf(page).reduce((sum, file) => sum + gzip(read(file)), 0);
const css = (page) => gzip([...read(page).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join(""));
const lazy = async (pattern) => {
  const files = (await readdir(new URL("_astro/", dist))).filter((f) => pattern.test(f));
  if (files.length !== 1)
    throw new Error(`Expected one file matching ${pattern} in dist/_astro, found ${files.length}.`);
  return gzip(read(`_astro/${files[0]}`));
};

const kB = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;
const budgets = [
  { name: "A site's page: JavaScript", size: js("github/index.html"), limit: 14_000 },
  { name: "A site's page: CSS", size: css("github/index.html"), limit: 6_500 },
  { name: "/health: JavaScript", size: js("health/index.html"), limit: 10_000 },
  { name: "/health: CSS", size: css("health/index.html"), limit: 6_500 },
  { name: "Word list, on the first passphrase", size: await lazy(/^eff-large\..+\.js$/), limit: 26_000 },
  { name: "Strength worker, on the first check", size: await lazy(/^zxcvbn\.worker-.+\.js$/), limit: 860_000 },
];

let over = false;
for (const { name, size, limit } of budgets) {
  const fits = size <= limit;
  over ||= !fits;
  console.log(`${fits ? "  " : "✗ "}${name.padEnd(40)} ${kB(size).padStart(9)}  of ${kB(limit)}`);
}
if (over) {
  console.error("\nOver budget. Make it smaller, or raise the limit in scripts/size.mjs and say why in the commit.");
  process.exit(1);
}
