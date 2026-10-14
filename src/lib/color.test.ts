import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ANY, platforms } from "@/data/platforms";
import { contrast, inkFor } from "./color";

describe("brand buttons", () => {
  it("are readable for every platform", () => {
    for (const p of platforms) expect(contrast(p.color, inkFor(p.color)), p.id).toBeGreaterThanOrEqual(4.5);
  });
});

describe("the coral accent", () => {
  it("is the same in TypeScript and in the CSS tokens", () => {
    // ANY.color is the source; global.css can't import it, so this keeps the two in step.
    const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
    expect(css).toContain(`--coral: ${ANY.color};`);
    expect(css).toContain(`--coral-ink: ${inkFor(ANY.color)};`);
  });
});
