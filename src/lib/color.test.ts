import { describe, expect, it } from "vitest";
import { ANY, platforms } from "@/data/platforms";
import { contrast, inkFor, SURFACE, uiBrand } from "./color";

const colors = [ANY.color, ...platforms.map((p) => p.color)];

describe("site colours", () => {
  it("keep the banner's text readable", () => {
    for (const c of colors) expect(contrast(c, inkFor(c)), c).toBeGreaterThanOrEqual(4.5);
  });

  it("hold 3:1 on the card in both themes as buttons, sliders and switches, with readable text on them", () => {
    for (const c of colors) {
      for (const theme of ["light", "dark"] as const) {
        const ui = uiBrand(c, theme);
        expect(contrast(ui, SURFACE[theme]), `${c} ${theme}`).toBeGreaterThanOrEqual(3);
        expect(contrast(ui, inkFor(ui)), `${c} ${theme} text`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
