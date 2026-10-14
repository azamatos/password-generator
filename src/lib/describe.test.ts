import { describe, expect, it } from "vitest";
import { platforms } from "@/data/platforms";
import { chipText, ruleTags, shareTags, shortSummary } from "./describe";

const byId = Object.fromEntries(platforms.map((p) => [p.id, p]));

describe("shortSummary", () => {
  it("matches the original list style", () => {
    expect(shortSummary(byId.github.rules)).toBe("Min 8 · a9");
    expect(shortSummary(byId.apple.rules)).toBe("8–63 · Aa9");
    expect(shortSummary(byId.paypal.rules)).toBe("8–20 · A/a + 9/!");
    expect(shortSummary(byId.microsoft.rules)).toBe("8–127 · 2 of 4");
    expect(shortSummary(byId.instagram.rules)).toBe("Min 6 · Any");
  });
});

describe("ruleTags", () => {
  it("keeps tags short", () => {
    expect(ruleTags(byId.netflix.rules)).toEqual(["6 to 60 characters", "No ~"]);
    expect(ruleTags(byId.google.rules)).toEqual(["At least 8 characters", "Any characters"]);
    expect(ruleTags(byId.apple.rules)).toContain("No character 3× in a row");
  });
});

describe("chipText", () => {
  const p = { locked: ["digit" as const], unavailable: ["symbol" as const] };

  it("keeps the base title, whatever it contains, and says why a chip is fixed", () => {
    expect(chipText("Numbers", "digit", p, "GitHub")).toEqual({
      title: "Numbers (required by GitHub)",
      state: ", required by GitHub",
    });
    expect(chipText("Symbols: !#$:", "symbol", p, "X").title).toBe("Symbols: !#$: (not accepted by X)");
    expect(chipText("Lowercase letters", "lower", p, "X")).toEqual({ title: "Lowercase letters", state: "" });
  });
});

describe("shareTags", () => {
  it("fits the rules in three tags at most", () => {
    expect(shareTags(byId.paypal.rules)).toEqual(["8–20 characters", "Letter", "Number or symbol"]);
    expect(shareTags(byId.apple.rules)).toEqual(["8–63 characters", "Lower, upper, number"]);
    expect(shareTags(byId.microsoft.rules)).toEqual(["8–127 characters", "2 of 4 types"]);
    expect(shareTags(byId.instagram.rules)).toEqual(["6+ characters", "Any characters"]);
  });
});
