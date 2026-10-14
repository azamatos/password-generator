import { describe, expect, it } from "vitest";
import { platforms } from "@/data/platforms";
import { contrast, inkFor } from "./color";

describe("brand buttons", () => {
  it("are readable for every platform", () => {
    for (const p of platforms) expect(contrast(p.color, inkFor(p.color)), p.id).toBeGreaterThanOrEqual(4.5);
  });
});
