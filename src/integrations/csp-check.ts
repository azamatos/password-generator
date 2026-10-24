import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import type { AstroIntegration } from "astro";

/**
 * Fails the build when a page has an inline script that the CSP in public/_headers would block, so a policy change
 * or a new inline script can't ship a page that silently stops working. An inline script passes when its hash is in
 * script-src. JSON data blocks (the ld+json) never run, so the CSP doesn't apply to them.
 */
export function cspCheck(): AstroIntegration {
  let publicDir: URL;
  return {
    name: "csp-check",
    hooks: {
      "astro:config:done": ({ config }) => {
        publicDir = config.publicDir;
      },
      "astro:build:done": async ({ dir }) => {
        const headers = await readFile(new URL("_headers", publicDir), "utf8");
        const scriptSrc = /script-src([^;\n]*)/.exec(headers)?.[1] ?? "";
        const blocked = new Set<string>();
        for (const file of await readdir(dir, { recursive: true })) {
          if (!file.endsWith(".html")) continue;
          const html = await readFile(new URL(file, dir), "utf8");
          for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
            if (/\bsrc=/.test(attributes) || /type="application\/(ld\+)?json"/.test(attributes)) continue;
            const hash = createHash("sha256").update(body).digest("base64");
            if (!scriptSrc.includes(`'sha256-${hash}'`)) blocked.add(`${file} ('sha256-${hash}')`);
          }
        }
        if (blocked.size > 0) {
          throw new Error(
            `The CSP in public/_headers would block inline scripts in:\n  ${[...blocked].join("\n  ")}\n` +
              "Move the script into a file, or add its hash to script-src.",
          );
        }
      },
    },
  };
}
