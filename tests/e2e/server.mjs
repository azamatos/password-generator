// Serves dist/ with the headers from public/_headers, as Cloudflare Pages does, so the tests run under the real CSP.
// Only path rules are applied ("/*", "/_astro/*"); the rules for Cloudflare's own hostnames are skipped.
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";

const port = Number(process.argv[2] ?? 4011);
const dist = new URL("../../dist/", import.meta.url).pathname;

const rules = [];
for (const line of (await readFile(join(dist, "_headers"), "utf8")).split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), headers: {} });
  else {
    const [, name, value] = /^\s+([^:]+):\s*(.*)$/.exec(line);
    rules.at(-1).headers[name] = value;
  }
}
const matches = (pattern, path) =>
  pattern.startsWith("/") &&
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`).test(path);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

async function resolve(path) {
  const file = join(dist, path);
  if (!file.startsWith(dist)) return null;
  try {
    const info = await stat(file);
    return info.isDirectory() ? resolve(join(path, "index.html")) : file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = await resolve(path);
  const headers = { "Content-Type": types[extname(file ?? "404.html")] ?? "application/octet-stream" };
  for (const rule of rules) if (matches(rule.pattern, path)) Object.assign(headers, rule.headers);
  res.writeHead(file ? 200 : 404, headers);
  res.end(await readFile(file ?? join(dist, "404.html")));
}).listen(port, () => console.log(`dist/ on http://localhost:${port}`));
